from enum import Enum

class UserType(str, Enum):
    ADMIN = 1
    EMPLOYER = 2
    CANDIDATE = 3
