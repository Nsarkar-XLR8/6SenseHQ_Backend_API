

import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { UserRoutes } from '../modules/user/user.route.js';
import { rootRouter } from './root.routes.js';
import { healthRouter } from './health.route.js';
import { systemRouter } from './system.route.js';

const router = Router();

import { passportRouter } from '../auth/passport.route.js';
import { stripeWebhookRouter } from '../payments/stripe.route.js';
import { CategoryRoutes } from '@/modules/category/category.routes.js';
import { ProductRoutes } from '@/modules/product/product.routes.js';

const moduleRoutes = [
    {
        path: '/',
        route: rootRouter,
    },
    {
        path: '/',
        route: healthRouter,
    },
    {
        path: '/system',
        route: systemRouter,
    },
    {
        path: '/auth',
        route: AuthRoutes,
    },
    {
        // Passport auth routes
        path: '/auth',
        route: passportRouter,
    },
    {
        path: '/user',
        route: UserRoutes
    },
    {
        // Stripe webhook route needs raw body parser
        path: '/webhooks',
        route: stripeWebhookRouter
    },
    {
        path: '/category',
        route: CategoryRoutes
    },
    {
        path: '/product',
        route: ProductRoutes
    }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
