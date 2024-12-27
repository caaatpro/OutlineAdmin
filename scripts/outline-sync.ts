import prisma from "@/prisma/db";
import ApiClient from "@/core/outline/api-client";
import { Server } from "@prisma/client";
import { DataLimitUnit, Outline } from "@/core/definitions";
import { convertDataLimitToUnit } from "@/core/utils";

const syncServer = async (outlineClient: ApiClient, server: Server): Promise<void> => {
    console.log("Getting server info from remote server...");
    const remoteServerInfo = await outlineClient.server();

    console.log("Getting server usage metrics...");
    const metrics = await outlineClient.metricsTransfer();

    const allMetrics = Object.values(metrics.bytesTransferredByUserId);
    const totalUsageMetrics = allMetrics.reduce((previousValue, currentValue) => previousValue + currentValue, 0);

    console.log("Updating server info in local database...");
    await prisma.server.update({
        where: { id: server.id },
        data: {
            name: remoteServerInfo.name,
            hostnameForNewAccessKeys: remoteServerInfo.hostnameForAccessKeys,
            portForNewAccessKeys: remoteServerInfo.portForNewAccessKeys,
            isMetricsEnabled: remoteServerInfo.metricsEnabled,
            totalDataUsage: totalUsageMetrics
        }
    });

    await syncAccessKeys(outlineClient, metrics, server.id);
};

const syncAccessKeys = async (outlineClient: ApiClient, metrics: Outline.Metrics, serverId: number): Promise<void> => {
    console.log("\nLoading servers access keys from local database...");
    const localAccessKeys = await prisma.accessKey.findMany({
        where: {
            serverId
        }
    });

    console.log("Getting server access keys...");
    const remoteAccessKeys = await outlineClient.keys();

    for (const remoteAccessKey of remoteAccessKeys) {
        console.log(`\n----->{${remoteAccessKey.name} (${remoteAccessKey.id})}`);
        const localAccessKey = localAccessKeys.find((localAccessKey) => localAccessKey.apiId === remoteAccessKey.id);

        const dataLimitUnit = localAccessKey ? (localAccessKey.dataLimitUnit as DataLimitUnit) : DataLimitUnit.Bytes;

        const dataLimit = remoteAccessKey.dataLimitInBytes
            ? convertDataLimitToUnit(remoteAccessKey.dataLimitInBytes, dataLimitUnit)
            : null;

        if (localAccessKey) {
            // this means we need to update the access key
            console.log(`Updating access key (${remoteAccessKey.name}) info in local database...`);

            await prisma.accessKey.update({
                where: { id: localAccessKey.id },
                data: {
                    name: remoteAccessKey.name,
                    dataLimit: dataLimit,
                    dataUsage: metrics.bytesTransferredByUserId[remoteAccessKey.id]
                }
            });
        } else {
            // and this means we need to create the access key
            console.log(`Creating missing access key (${remoteAccessKey.name}) in local database...`);

            await prisma.accessKey.create({
                data: {
                    serverId: serverId,
                    name: remoteAccessKey.name,
                    prefix: null,
                    expiresAt: null,
                    dataLimit: dataLimit,
                    dataLimitUnit: DataLimitUnit.Bytes,
                    apiId: remoteAccessKey.id,
                    accessUrl: remoteAccessKey.accessUrl,
                    method: remoteAccessKey.method,
                    password: remoteAccessKey.password,
                    port: remoteAccessKey.port
                }
            });
        }
    }

    console.log("\nRemoving access keys that does not exist in remote server...");

    const localAccessKeysToRemove = [];

    for (const localAccessKey of localAccessKeys) {
        if (remoteAccessKeys.find((remoteAccessKey) => remoteAccessKey.id === localAccessKey.apiId)) {
            continue;
        }

        console.log(`\n----->{${localAccessKey.name} (${localAccessKey.apiId})}`);
        localAccessKeysToRemove.push(localAccessKey.id);
    }

    if (localAccessKeysToRemove.length > 0) {
        console.log("Removing access keys from local database...", localAccessKeysToRemove);

        await prisma.accessKey.deleteMany({
            where: {
                id: {
                    in: localAccessKeysToRemove
                }
            }
        });
    } else {
        console.log("There is no access key to remove");
    }
};

const run = async () => {
    console.log("Loading servers from local database...");
    const servers = await prisma.server.findMany();

    console.log("Syncing started...");
    for (const server of servers) {
        console.log(`\n=====>{${server.name} - ${server.apiId}}`);

        const outlineClient = ApiClient.fromConfig(server.managementJson);

        await syncServer(outlineClient, server);
    }
};

run()
    .then(() => {
        console.log("\nScript executed successfully 😎");
    })
    .catch((error) => {
        console.log("\nScript failed successfully 🥺\n");
        console.error(error);
    });
