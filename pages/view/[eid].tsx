import { decryptKey } from "@/lib/cipher";
import { getObjectMetadata } from "@/lib/s3";
import { selectFirst } from "@/lib/utils";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import React from "react";
import Link from "next/link";
import CocoHeader from "@/components/CocoHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import FooterSection from "@/components/FooterSection";

interface S3Metadata {
    "content-type": string;
    mtime: string;
    [key: string]: any;
}

interface ObjectProps {
    decryptedUrl: string;
    baseUrl: string;
    metadata: S3Metadata;
    size: number;
}

class S3ObjectInfo extends React.Component<ObjectProps> {
    buildUrl(baseUrl: string, decryptedUrl: string) {
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.slice(0, -1);
        }
        if (decryptedUrl.startsWith("/")) {
            decryptedUrl = decryptedUrl.slice(1);
        }
        return `${baseUrl}/${decryptedUrl}`;
    }

    render() {
        const splitData = this.props.decryptedUrl.split("/");
        const titleData = splitData[splitData.length - 1];
        const restMeerge = splitData.slice(0, splitData.length - 1).join("/");
        const mergedUrl = this.buildUrl(this.props.baseUrl, this.props.decryptedUrl);
        return (
            <React.Fragment>
                <Head>
                    <title>{titleData}</title>
                    <meta name="description" content="An archive of VTuber stuff" />
                </Head>
                <main className="py-8 quick-container">
                    <CocoHeader />
                    <hr className="mt-6" />
                    <Breadcrumbs path={restMeerge} className="my-4" isViewMode />
                    <div className="flex flex-col bg-gray-700 px-4 py-4 rounded-md">
                        <h1 className="text-lg font-bold text-center">{titleData}</h1>
                        <p className="text-center mt-1">{this.props.metadata["content-type"]}</p>
                        <div className="flex flex-row gap-2 items-center justify-center mt-4">
                            <Link href={mergedUrl}>
                                <a className="px-4 py-2 bg-blue-500 hover:bg-blue-600 transition rounded-md">
                                    Download
                                </a>
                            </Link>
                            <Link href="/">
                                <a className="px-4 py-2 bg-red-500 hover:bg-red-600 transition rounded-md">
                                    Home
                                </a>
                            </Link>
                        </div>
                    </div>
                    <FooterSection />
                </main>
            </React.Fragment>
        );
    }
}

export default S3ObjectInfo;

function decodeHTMLEntities(contents: string) {
    const mappings = { amp: "&", lt: "<", gt: ">", quot: `"`, "#039": "'", apos: "'" };
    return contents.replace(/&([^;]+);/g, (m, c) => mappings[c]);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const { eid } = context.params;

    const selectFirstEID = selectFirst(eid);
    let decryptedUrl = decryptKey(selectFirstEID);
    if (decryptedUrl.startsWith("/")) {
        decryptedUrl = decryptedUrl.substring(1);
    }
    // Some stuff for some reason got encoded
    decryptedUrl = decodeHTMLEntities(decryptedUrl);

    const s3Metadata = await getObjectMetadata(decryptedUrl);

    return {
        props: {
            decryptedUrl,
            baseUrl: process.env.S3_DOWNLOAD_LINK_BASE,
            metadata: s3Metadata.metaData,
            size: s3Metadata.size,
        },
    };
}