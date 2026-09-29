export const en = {
  common: {
    validationFailed: "Validation failed",
    notFound: "Resource not found",
    serverError: "Something went wrong",
    unauthorized: "Unauthorized",
    forbidden: "You do not have permission to access this resource",
    internalServerError: "Something went wrong. Please try again later.",
  },
  auth: {
    emailAlreadyExists: "Email already exists",
    signupSuccess: "Account created successfully",
    invalidCredentials: "The email or password is incorrect",
    signinSuccess: "Signed in successfully",
    logoutSuccess: "Logged out successfully",
  },
  collection: {
    created: "Collection created successfully",
    createFailed: "Failed to create collection",
    updated: "Collection updated successfully",
    updateFailed: "Failed to update collection",
    notFound: "Collection not found",
    deleted: "Collection deleted successfully",
    deleteFailed: "Failed to delete collection",
  },
} as const;
