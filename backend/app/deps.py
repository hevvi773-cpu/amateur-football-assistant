"""身份与权限依赖。

原型阶段无真实登录，通过请求头模拟当前用户：
- X-User-Id:   当前用户球员ID，默认 "p1"（张伟，南宁联队队长）
- X-User-Role: 当前身份，默认 "member"，可选 member/captain/association/visitor
"""
from typing import Optional

from fastapi import Depends, Header, HTTPException

VALID_ROLES = {"member", "captain", "association", "visitor"}


def get_current_user(
    x_user_id: Optional[str] = Header(default="p1"),
    x_user_role: Optional[str] = Header(default="member"),
) -> dict:
    role = (x_user_role or "member").lower()
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"非法身份: {role}")
    return {"user_id": x_user_id or "p1", "role": role}


def require_roles(*roles: str):
    """返回一个依赖，校验当前身份是否属于允许集合，并透传用户信息。"""

    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="当前身份无此操作权限")
        return user

    return checker
