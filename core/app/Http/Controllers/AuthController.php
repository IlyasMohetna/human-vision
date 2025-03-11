<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|min:6',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password'
            ], 401);
        }

        $user = Auth::user();

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'token' => $token
        ]);
    }

    public function me(Request $request)
    {
        $resource = new UserResource($request->user());
        return response()->json($resource);
    }
}
