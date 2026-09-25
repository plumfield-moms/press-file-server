import os
from typing import Annotated, Literal, TypedDict

from fastapi import Depends, Header, HTTPException
from starlette import status

from server.types import User


class UserRecord(TypedDict):
    name: str
    email: str
    role: Literal["user", "admin"]


USERS: dict[str, UserRecord] = {
    "kristi": {
        "name": "Kristi",
        "email": "tarpfarmer@gmail.com",
        "role": "user"
    },
    "ed": {
        "name": "Ed",
        "email": "garboczi@msn.com",
        "role": "user"
    },
    "diane": {
        "name": "Diane",
        "email": "dianependergraft@hotmail.com",
        "role": "user"
    },
    "sara": {
        "name": "Sara",
        "email": "plumfieldmoms@gmail.com",
        "role": "admin"
    },
    "greta": {
        "name": "Greta",
        "email": "masarikfamilymargaret@gmail.com",
        "role": "user"
    },
    "michael": {
        "name": "Michael",
        "email": "masarikfamilymichael@gmail.com",
        "role": "admin"
    }
}


def get_user(email: str) -> User | None:
    """Gets a user based on email
    :param email: The email of the user to find
    :type email: str
    :returns: Either a User object or None
    :rtype: User | None
    """
    for key, value in USERS.items():
        if value.get("email") == email:
            email = value.get("email")
            name = value.get("name")
            role = value.get("role")
            if not name and not role:
                return None
            return User(email=email, username=key, role=role, name=name)
    return None


def get_current_user(
        x_user_email: Annotated[str | None, Header()] = None,
        cf_access_authenticated_user_email: Annotated[str | None, Header()] = None,
) -> User:
    """Retrieves the current user based on the Cloudflare Headers
    :param x_user_email: One possible header value
    :type x_user_email: str
    :param cf_access_authenticated_user_email: Another possible header
    :type cf_access_authenticated_user_email: str
    :returns: The user object for the given email
    :rtype: User
    :raises HTTPException: Raises an HTTP exception with a status of `401 Unauthorized`

    """
    email = cf_access_authenticated_user_email or x_user_email
    
    if os.getenv("ENV", None) != "localhost":
        if not email:
            print(f"[LOGIN] login attempt for email {email}")
            print("[LOGIN] BLOCKED login - missing email.")
            print("[LOGIN] Headers:")
            print(f"[LOGIN]\tx_user_email: {x_user_email}")
            print(
                f"[LOGIN]\tcf_access_authenticated_user_email: {cf_access_authenticated_user_email}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth headers"
            )
    
        user = get_user(email)
    else:
        print("[DEV LOGIN] login attempt for email plumfieldmoms@gmail.com")
        user = get_user("plumfieldmoms@gmail.com")
    if not user:
        print(f"[LOGIN] BLOCKED login for {email}: invalid user")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"User {email} not found"
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]