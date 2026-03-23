import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { UserService } from "./user.service.js";
import AppError from "../../errors/AppError.js";



const getMyProfile = catchAsync(async (req, res) => {
    // 1. Extract the ID based on your ACTUAL token structure
    // Since your error says the type has 'userId', use that.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = (req.user as any) || {};

    if (!userId) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, 'Invalid token payload: User ID missing');
    }

    const result = await UserService.getMyProfileFromDB(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Profile retrieved successfully',
        data: result,
    });
});

const updateMyProfile = catchAsync(async (req, res) => {
    // 1. Extract the ID based on your ACTUAL token structure
    // Since your error says the type has 'userId', use that.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = (req.user as any) || {};

    if (!userId) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, 'Invalid token payload: User ID missing');
    }

    const result = await UserService.updateMyProfileInDB(userId, req.validated!.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});


const getAllUsers = catchAsync(async (req, res) => {
    const result = await UserService.getAllUsersFromDB(req.validated!.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Users retrieved successfully',
        data: result,
    });
});




export const UserController = {
    getMyProfile,
    updateMyProfile,
    getAllUsers
}