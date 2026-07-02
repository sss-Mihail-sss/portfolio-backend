import pgvector from "@prisma-next/extension-pgvector/pack";
import postgis from "@prisma-next/extension-postgis/pack";
import { defineContract, rel } from "@prisma-next/postgres/contract-builder";

export const contract = defineContract(
  {
    extensionPacks: { pgvector, postgis },
  },
  ({ field, model }) => {
    const User = model("User", {
      fields: {
        id: field.id.uuidv7String(),
        email: field.text().optional(),
        emailVerifiedAt: field.dateTime().optional(),
        phoneNumber: field.text().optional(),
        phoneNumberVerifiedAt: field.dateTime().optional(),
        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    const Identity = model("Identity", {
      fields: {
        id: field.id.uuidv7String(),
        userId: field.uuidString(),
        type: field.text(),
        identifier: field.text(),
        credential: field.text().optional(),
        verifiedAt: field.dateTime().optional(),
        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    const Session = model("Session", {
      fields: {
        id: field.id.uuidv7String(),
        userId: field.uuidString(),
        userAgent: field.text(),
        ipAddress: field.text(),
        expiredAt: field.dateTime(),
        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    const Verification = model("Verification", {
      fields: {
        id: field.id.uuidv7String(),
        expiredAt: field.dateTime(),
        createdAt: field.temporal.createdAt(),
      },
    });

    // 1:1 to User — everything mutable/public about a person lives here,
    // the User row stays a stable auth anchor.
    const Profile = model("Profile", {
      fields: {
        id: field.id.uuidv7String(),
        userId: field.uuidString().unique({ name: "profile_userId_key" }),
        displayName: field.text().optional(),
        firstName: field.text().optional(),
        lastName: field.text().optional(),
        bio: field.text().optional(),
        avatarUrl: field.text().optional(),
        websiteUrl: field.text().optional(),
        location: field.text().optional(),
        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // External OAuth identities (github, google, ...). Tokens are stored to
    // call provider APIs later; (provider, providerAccountId) is unique.
    const OAuthAccount = model("OAuthAccount", {
      fields: {
        id: field.id.uuidv7String(),
        userId: field.uuidString(),
        provider: field.text(),
        providerAccountId: field.text(),
        accessToken: field.text().optional(),
        refreshToken: field.text().optional(),
        accessTokenExpiresAt: field.dateTime().optional(),
        scope: field.text().optional(),
        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    const Role = model("Role", {
      fields: {
        id: field.id.uuidv7String(),
        name: field.text().unique({ name: "role_name_key" }),
        description: field.text().optional(),
        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // Permission names are machine keys, e.g. "posts:write", "users:manage".
    const Permission = model("Permission", {
      fields: {
        id: field.id.uuidv7String(),
        name: field.text().unique({ name: "permission_name_key" }),
        description: field.text().optional(),
        createdAt: field.temporal.createdAt(),
      },
    });

    // Explicit join models — prisma-next has no implicit many-to-many.
    const UserRole = model("UserRole", {
      fields: {
        id: field.id.uuidv7String(),
        userId: field.uuidString(),
        roleId: field.uuidString(),
        createdAt: field.temporal.createdAt(),
      },
    });

    const RolePermission = model("RolePermission", {
      fields: {
        id: field.id.uuidv7String(),
        roleId: field.uuidString(),
        permissionId: field.uuidString(),
        createdAt: field.temporal.createdAt(),
      },
    });

    return {
      models: {
        User: User.relations({
          sessions: rel.hasMany(Session, { by: "userId" }),
          identities: rel.hasMany(Identity, { by: "userId" }),
          profile: rel.hasOne(Profile, { by: "userId" }),
          oauthAccounts: rel.hasMany(OAuthAccount, { by: "userId" }),
          userRoles: rel.hasMany(UserRole, { by: "userId" }),
        }).sql({ table: "user" }),

        Identity: Identity.relations({
          user: rel.belongsTo(User, { from: "userId", to: "id" }),
        })
          // One identity per (type, identifier) — e.g. an email can back only
          // one account; the app-level existsByEmail check alone is racy.
          .attributes(({ fields, constraints }) => ({
            uniques: [
              constraints.unique([fields.type, fields.identifier], {
                name: "identity_type_identifier_key",
              }),
            ],
          }))
          .sql(({ cols, constraints }) => ({
          table: "identity",
          foreignKeys: [
            constraints.foreignKey(cols.userId, User.refs.id, { name: "identity_userId_fkey" }),
          ],
          indexes: [constraints.index([cols.userId], { name: "identity_userId_idx" })],
        })),

        Session: Session.relations({
          user: rel.belongsTo(User, { from: "userId", to: "id" }),
        }).sql(({ cols, constraints }) => ({
          table: "session",
          foreignKeys: [
            constraints.foreignKey(cols.userId, User.refs.id, { name: "session_userId_fkey" }),
          ],
          indexes: [constraints.index([cols.userId], { name: "session_userId_idx" })],
        })),

        Verification: Verification.sql({ table: "verification" }),

        Profile: Profile.relations({
          user: rel.belongsTo(User, { from: "userId", to: "id" }),
        }).sql(({ cols, constraints }) => ({
          table: "profile",
          foreignKeys: [
            constraints.foreignKey(cols.userId, User.refs.id, {
              name: "profile_userId_fkey",
              onDelete: "cascade",
            }),
          ],
        })),

        OAuthAccount: OAuthAccount.relations({
          user: rel.belongsTo(User, { from: "userId", to: "id" }),
        })
          .attributes(({ fields, constraints }) => ({
            uniques: [
              constraints.unique([fields.provider, fields.providerAccountId], {
                name: "oauth_account_provider_providerAccountId_key",
              }),
            ],
          }))
          .sql(({ cols, constraints }) => ({
          table: "oauth_account",
          foreignKeys: [
            constraints.foreignKey(cols.userId, User.refs.id, {
              name: "oauth_account_userId_fkey",
              onDelete: "cascade",
            }),
          ],
          indexes: [constraints.index([cols.userId], { name: "oauth_account_userId_idx" })],
        })),

        Role: Role.relations({
          userRoles: rel.hasMany(UserRole, { by: "roleId" }),
          rolePermissions: rel.hasMany(RolePermission, { by: "roleId" }),
        }).sql({ table: "role" }),

        Permission: Permission.relations({
          rolePermissions: rel.hasMany(RolePermission, { by: "permissionId" }),
        }).sql({ table: "permission" }),

        UserRole: UserRole.relations({
          user: rel.belongsTo(User, { from: "userId", to: "id" }),
          role: rel.belongsTo(Role, { from: "roleId", to: "id" }),
        })
          .attributes(({ fields, constraints }) => ({
            uniques: [
              constraints.unique([fields.userId, fields.roleId], {
                name: "user_role_userId_roleId_key",
              }),
            ],
          }))
          .sql(({ cols, constraints }) => ({
          table: "user_role",
          foreignKeys: [
            constraints.foreignKey(cols.userId, User.refs.id, {
              name: "user_role_userId_fkey",
              onDelete: "cascade",
            }),
            constraints.foreignKey(cols.roleId, Role.refs.id, {
              name: "user_role_roleId_fkey",
              onDelete: "cascade",
            }),
          ],
          indexes: [constraints.index([cols.roleId], { name: "user_role_roleId_idx" })],
        })),

        RolePermission: RolePermission.relations({
          role: rel.belongsTo(Role, { from: "roleId", to: "id" }),
          permission: rel.belongsTo(Permission, { from: "permissionId", to: "id" }),
        })
          .attributes(({ fields, constraints }) => ({
            uniques: [
              constraints.unique([fields.roleId, fields.permissionId], {
                name: "role_permission_roleId_permissionId_key",
              }),
            ],
          }))
          .sql(({ cols, constraints }) => ({
          table: "role_permission",
          foreignKeys: [
            constraints.foreignKey(cols.roleId, Role.refs.id, {
              name: "role_permission_roleId_fkey",
              onDelete: "cascade",
            }),
            constraints.foreignKey(cols.permissionId, Permission.refs.id, {
              name: "role_permission_permissionId_fkey",
              onDelete: "cascade",
            }),
          ],
          indexes: [constraints.index([cols.permissionId], { name: "role_permission_permissionId_idx" })],
        })),
      },
    };
  },
);
