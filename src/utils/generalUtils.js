export function generateResponse(success, status, message) {
  if (!success) {
    return {
      success: false,
      error: {
        status: status,
        message: message,
      },
    };
  } else {
    return {
      success: true,
      message: message,
    };
  }
}
