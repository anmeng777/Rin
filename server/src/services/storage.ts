// import { PutObjectCommand } from "@aws-sdk/client-s3";
import Elysia, { t } from "elysia";
import path from "node:path";
import type { Env } from "../db/db";
import { setup } from "../setup";
// import { createS3Client } from "../utils/s3";

function buf2hex(buffer: ArrayBuffer) {
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

// 首先，定义接口来描述 JSON 数组中的每一个对象结构
interface ImageResponse {
    src: string; // 假设每个对象有一个名为 'src' 的字符串属性
    // 如果有其他属性，也可以在这里添加
}

export const StorageService = (db: DB, env: Env) => {
    const host = `https://telegra.ph`;
    const endpoint = env.S3_ENDPOINT;
    const bucket = env.S3_BUCKET;
    const folder = env.S3_FOLDER || '';
    // const accessHost = env.S3_ACCESS_HOST || endpoint;
    const accessKeyId = env.S3_ACCESS_KEY_ID;
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY;
    // const s3 = createS3Client(env);
    return new Elysia({ aot: false })
        .use(setup())
        .group('/storage', (group) =>
            group
                .post('/', async ({ uid, set, body: { key, file } }) => {

                    if (!endpoint) {
                        set.status = 500;
                        return 'S3_ENDPOINT is not defined'
                    }
                    if (!accessKeyId) {
                        set.status = 500;
                        return 'S3_ACCESS_KEY_ID is not defined'
                    }
                    if (!secretAccessKey) {
                        set.status = 500;
                        return 'S3_SECRET_ACCESS_KEY is not defined'
                    }
                    if (!bucket) {
                        set.status = 500;
                        return 'S3_BUCKET is not defined'
                    }
                    if (!uid) {
                        set.status = 401;
                        return 'Unauthorized';
                    }
                    const suffix = key.includes(".") ? key.split('.').pop() : "";
                    const hashArray = await crypto.subtle.digest(
                        { name: 'SHA-1' },
                        await file.arrayBuffer()
                    );
                    const hash = buf2hex(hashArray)
                    const hashkey = path.join(folder, hash + "." + suffix);
                    
                    // 改用telegram 上传，注释掉原有代码
                    // try {
                    //     const response = await s3.send(new PutObjectCommand({ Bucket: bucket, Key: hashkey, Body: file }))
                    //     console.info(response);
                    //     return `${accessHost}/${bucket}/${hashkey}`
                    // } catch (e: any) {
                    //     set.status = 400;
                    //     console.error(e.message)
                    //     return e.message
                    // }
                    
                    const formData = new FormData();
                    formData.append("file", file as Blob, hashkey);
                    try {
                        const responseFromTele = await fetch(`${host}/upload`, { method: "POST", body: formData });
                        const responseJson:ImageResponse[] = await responseFromTele.json();
                        return 'https://rin-server.anmeng.tech' + responseJson[0].src;
                    } catch (e: any) {
                        set.status = 400;
                        console.error(e.message)
                        return e.message
                    }
                }, {
                    body: t.Object({
                        key: t.String(),
                        file: t.File()
                    })
                })
        );
}