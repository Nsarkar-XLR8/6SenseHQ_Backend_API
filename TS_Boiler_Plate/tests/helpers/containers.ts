/**
 * Testcontainers Helpers
 *
 * Provides utilities to spin up real MongoDB and Redis containers
 * for integration tests. Requires Docker to be running.
 */
import { GenericContainer, type StartedTestContainer } from "testcontainers";

let mongoContainer: StartedTestContainer | null = null;
let redisContainer: StartedTestContainer | null = null;

export interface ContainerURIs {
    mongoUri: string;
    redisUri: string;
}

/**
 * Start MongoDB and Redis containers.
 * Returns their connection URIs.
 */
export async function startContainers(): Promise<ContainerURIs> {
    console.log("Starting MongoDB container...");
    // Start MongoDB container
    mongoContainer = await new GenericContainer("mongo:6")
        .withExposedPorts(27017)
        .withStartupTimeout(120_000)
        .start();

    const mongoHost = mongoContainer.getHost();
    const mongoPort = mongoContainer.getMappedPort(27017);
    const mongoUri = `mongodb://${mongoHost}:${mongoPort}/test_db`;
    console.log(`MongoDB started at ${mongoUri}`);

    console.log("Starting Redis container...");
    // Start Redis container
    redisContainer = await new GenericContainer("redis:7-alpine")
        .withExposedPorts(6379)
        .withStartupTimeout(60_000)
        .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    const redisUri = `redis://${redisHost}:${redisPort}`;
    console.log(`Redis started at ${redisUri}`);

    return { mongoUri, redisUri };
}

/**
 * Stop and remove all test containers.
 */
export async function stopContainers(): Promise<void> {
    await Promise.allSettled([
        mongoContainer?.stop(),
        redisContainer?.stop(),
    ]);
    mongoContainer = null;
    redisContainer = null;
}
