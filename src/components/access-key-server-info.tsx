import { Chip, Snippet, Tooltip } from "@heroui/react";
import React from "react";
import { Server } from "@prisma/client";
import moment from "moment";

import { CopyIcon } from "@/src/components/icons";
import { formatBytes } from "@/src/core/utils";

interface Props {
    server: Server;
    numberOfKeys: number;
}

export default function AccessKeyServerInfo({ server, numberOfKeys }: Props) {
    return (
        <section className="rounded-xl bg-default-100 p-4 grid grid-cols-2 gap-y-2 gap-x-8">
            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Hostname or IP</span>
                <Snippet
                    classNames={{
                        base: "!max-w-[300px]",
                        copyButton: "text-sm !min-w-6 !w-6 h-6",
                        pre: "!ps-1 truncate"
                    }}
                    copyIcon={<CopyIcon size={16} />}
                    hideSymbol={true}
                    size="sm"
                    variant="flat"
                >
                    {server.hostnameOrIp}
                </Snippet>
            </div>

            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Port</span>
                <Snippet
                    classNames={{
                        base: "!max-w-[200px]",
                        copyButton: "text-sm !min-w-6 !w-6 h-6",
                        pre: "!ps-1 truncate"
                    }}
                    copyIcon={<CopyIcon size={16} />}
                    hideSymbol={true}
                    size="sm"
                    variant="flat"
                >
                    {server.portForNewAccessKeys}
                </Snippet>
            </div>

            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Status</span>
                <Chip color={server.isAvailable ? "success" : "danger"} size="sm" variant="flat">
                    {server.isAvailable ? "Available" : "Not Available"}
                </Chip>
            </div>

            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Version</span>
                <Chip size="sm" variant="flat">
                    {server.version}
                </Chip>
            </div>

            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Number of keys</span>
                <Chip size="sm" variant="flat">
                    {numberOfKeys}
                </Chip>
            </div>

            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Total usage</span>
                <Chip size="sm" variant="flat">
                    {formatBytes(Number(server.totalDataUsage))}
                </Chip>
            </div>

            <div className="flex justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Creation date</span>
                <Tooltip closeDelay={200} content={moment(server.apiCreatedAt).fromNow()} delay={600} size="sm">
                    <Chip size="sm" variant="flat">
                        {moment(server.apiCreatedAt).format("YYYY-MM-DD HH:mm:ss")}
                    </Chip>
                </Tooltip>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 col-span-2 md:col-span-1">
                <span className="text-sm text-default-500">Management URL</span>
                <Snippet
                    classNames={{
                        base: "!max-w-[280px] md:!max-w-[300px]",
                        copyButton: "text-sm !min-w-6 !w-6 h-6",
                        pre: "!ps-1 truncate"
                    }}
                    copyIcon={<CopyIcon size={16} />}
                    hideSymbol={true}
                    size="sm"
                    title={server.apiUrl}
                    variant="flat"
                >
                    {server.apiUrl}
                </Snippet>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 col-span-2 ">
                <span className="text-sm text-default-500">Management JSON</span>
                <Snippet
                    classNames={{
                        base: "!max-w-[280px] md:!max-w-[700px]",
                        copyButton: "text-sm !min-w-6 !w-6 h-6",
                        pre: "!ps-1 truncate"
                    }}
                    copyIcon={<CopyIcon size={16} />}
                    hideSymbol={true}
                    size="sm"
                    title={server.managementJson}
                    variant="flat"
                >
                    {server.managementJson}
                </Snippet>
            </div>
        </section>
    );
}
