import { searchCommits, SearchCommitsRequest } from "@/features/search/gitApi";
import { serviceErrorResponse } from "@/lib/serviceError";
import { isServiceError } from "@/lib/utils";
import { NextRequest } from "next/server";
import { schemaValidationError } from "@/lib/serviceError";
import { searchCommitsRequestSchema } from "@/features/search/schemas";
import { withOptionalAuthV2 } from "@/withAuthV2";

export const POST = async (request: NextRequest) => withOptionalAuthV2(async () => {
    const body = await request.json();
    const parsed = await searchCommitsRequestSchema.safeParseAsync(body);

    if (!parsed.success) {
        return serviceErrorResponse(
            schemaValidationError(parsed.error)
        );
    }

    const response = await searchCommits(parsed.data as SearchCommitsRequest);

    if (isServiceError(response)) {
        return serviceErrorResponse(response);
    }

    return Response.json(response);
});
