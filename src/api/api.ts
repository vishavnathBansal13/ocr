// src/api.ts
import axios from "axios";
import { toast } from "react-toastify";

// Base API config
const API_BASE_URL = "https://dev-categorization.musetax.com/v2/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
export interface MakeSessionTokenParams {
  userId: string;
  access_token: string;
}

/**
 * Response type for getAccessToken
 */
export interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Fetches an access token using client_id and client_secret.
 */
export async function getAccessToken(
  client_id: string,
  client_secret: string
): Promise<AccessTokenResponse> {
  const body = new URLSearchParams();
  body.append("client_id", client_id);
  body.append("client_secret", client_secret);

  try {
    const response = await axios.post(
      "https://api-devbe.musetax.com/auth/token",
      body.toString(),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "Service-Key": "checkboost",
        },
      }
    );
    console.log(response, "responseresponse12222");
    if (response?.status == 200) {
      toast.success("Access token created.", { toastId: "tokefn" });
    } else {
      toast.error("Something went wrong.", { toastId: "tokefn" });
    }
    return response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.detail[0] ?? error?.response?.data?.detail,
      { toastId: "dfdj" }
    );
    console.error("Failed to get access token:", error);
    throw error;
  }
}

/**
 * Data type for user creation payload.
 */
export interface CreateUserPayload {
  username: string;
  email: string;
  plaid_user_id: string;
}

/**
 * Response type for createUser
 */
export interface CreateUserResponse {
  user_id: string;
  [key: string]: any; // In case API returns more fields
}

/**
 * Creates a user with the given data and access token.
 */
export async function createUser(
  user: CreateUserPayload,
  accessToken: string
): Promise<CreateUserResponse> {
  try {
    const response = await api.post("/users", user, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(response, "responseresponse");
    if (response?.status === 200) {
      toast.success(response?.data?.message, { toastId: "creted" });
    } else {
      toast.error("Something went wrong.", { toastId: "creted" });
    }
    return response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.detail[0] ?? error?.response?.data?.detail,
      { toastId: "dfdj" }
    );
    console.error("Failed to create user:", error);
    throw error;
  }
}

/**
 * Response type for addTransaction API.
 */
export interface AddTransactionResponse {
  [key: string]: any; // Define specific fields if known
}

/**
 * Adds a transaction for a given user.
 */
export async function addTransaction(
  payload: any
): Promise<AddTransactionResponse> {
  const requestBody = {
    user_id: payload.user_id,
    transactions: payload.transactions, // <-- remove the []
  };

  try {
    const response = await api.post("/transactions", requestBody);
    console.log(response, "sfshsfhb");
    if (response?.status == 200) {
      toast.success("Transaction created successfully.", {
        toastId: "trans-succ",
      });
    } else {
      toast.success("Transaction not created,try after sometime.", {
        toastId: "trans-succ",
      });
    }
    return response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.detail[0] ?? error?.response?.data?.detail,
      { toastId: "dfdj" }
    );
    console.error("Failed to add transaction:", error);
    throw error;
  }
}
export const makeSessionToken = async (
  userId:string,
  access_token:string) => {
  try {
  
 
    const response = await api.post(
      "/widgets/session",
      {
        user_id: userId,
        domain_urls: [`${window.location.origin}/`],
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
 
    console.log(response.data, "makeSessionToken response");
 
    const { widget_session_token, detail } = response.data;
 
    if (widget_session_token) {
    //   onSuccess(widget_session_token);
      toast.success("Session token created successfully.", { toastId: "session-token" });
      return response.data
    } else {
      const errorMsg = detail || "Invalid session token response";
    //   setError?.(errorMsg);
    //   onError?.(errorMsg);
      toast.error(errorMsg, { toastId: "session-token-error" });
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.detail ??
      (error instanceof Error ? error.message : "Unknown error while fetching session token");
    // setError?.(msg);
    // onError?.(msg);
    toast.error(msg, { toastId: "session-token-error" });
    console.error("Failed to make session token:", error);
  }
};