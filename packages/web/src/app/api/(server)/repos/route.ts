import { getRepos } from "@/actions";
import { serviceErrorResponse } from "@/lib/serviceError";
import { isServiceError } from "@/lib/utils";
import { GetReposResponse } from "@/lib/types";
import { NextRequest } from "next/server";


export const GET = async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const activeAfter = searchParams.get('activeAfter') || undefined;
    const activeBefore = searchParams.get('activeBefore') || undefined;

    const repos: GetReposResponse = await getRepos({
        activeAfter,
        activeBefore,
    });
    if (isServiceError(repos)) {
        return serviceErrorResponse(repos);
    }
    return Response.json(repos);
}
