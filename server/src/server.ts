import cors from '@elysiajs/cors';
import { serverTiming } from '@elysiajs/server-timing';
import { Elysia } from 'elysia';
import type { DB } from './_worker';
import type { Env } from './db/db';
import { CommentService } from './services/comments';
import { FeedService } from './services/feed';
import { FriendService } from './services/friends';
import { TagService } from './services/tag';
import { UserService } from './services/user';
import { StorageService } from './services/storage';
import { SEOService } from './services/seo';
import { RSSService } from './services/rss';

const host = `https://telegra.ph`;

export const app = (db: DB, env: Env) => new Elysia({ aot: false })
    .use(cors({
        aot: false,
        origin: '*',
        methods: '*',
        allowedHeaders: [
            'Authorization',
            'content-type'
        ],
        maxAge: 600,
        credentials: true,
        preflight: true
    }))
    .use(serverTiming({
        enabled: true,
    }))
    .use(UserService(db, env))
    .use(FeedService(db, env))
    .use(CommentService(db, env))
    .use(TagService(db))
    .use(StorageService(db, env))
    .use(FriendService(db, env))
    .use(SEOService(env))
    .use(RSSService(env))
    .get('/', () => `Hi`)
    // .get('/file/:fileName', async ({params: {fileName}}) => {
    //     return fetch(`${host}/file/${fileName}`);
    // }, {
    //     params: t.Object({
    //         fileName: t.String()
    //     })
    // })
    .get('/file/:fileName', async ({ params: { fileName }}) => {
        // return fetch(`https://telegra.ph/file/44f30de6accd493b205c8.png`);
        // Fetch the resource
        const response = await fetch(`${host}/file/${fileName}`);

        // Check if the fetch was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        // Create a new Response object to ensure headers can be manipulated
        const newResponse = new Response(await response.blob(), {
            status: response.status,
            statusText: response.statusText,
            headers: {
                // You may need to explicitly set some headers important for the client here,
                // especially if they are needed for correct content handling (e.g., Content-Type).
                // Example:
                // 'Content-Type': response.headers.get('Content-Type'),
            },
        });

        return newResponse;
    })
    .onError(({ path, params, code }) => {
        if (code === 'NOT_FOUND')
            return `${path} ${JSON.stringify(params)} not found`
    })

export type App = ReturnType<typeof app>;