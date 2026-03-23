export const USER_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    USER: "USER",
    OWNER: "OWNER",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLE_LIST = Object.values(USER_ROLE) as UserRole[];

export function isUserRole(value: unknown): value is UserRole {
    return normalizeUserRole(value) !== undefined;
}

export function normalizeUserRole(value: unknown): UserRole | undefined {
    if (typeof value !== "string") return undefined;

    const normalized = value.toUpperCase();
    if ((USER_ROLE_LIST as string[]).includes(normalized)) {
        return normalized as UserRole;
    }

    // Backward compatibility for legacy lowercase tokens/data.
    if (value === "owner") return USER_ROLE.OWNER;
    return undefined;
}
