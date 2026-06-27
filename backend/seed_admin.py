"""Run once to create an admin user: python seed_admin.py"""
import asyncio
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@cloudlabs.com"))
        if result.scalar_one_or_none():
            print("Admin user already exists.")
            return

        admin = User(
            email="admin@cloudlabs.com",
            name="Admin",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)

        user = User(
            email="user@cloudlabs.com",
            name="Test User",
            hashed_password=hash_password("User@123"),
            role=UserRole.user,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print("Created users:")
        print("  Admin -> admin@cloudlabs.com / Admin@123")
        print("  User  -> user@cloudlabs.com  / User@123")


asyncio.run(main())
