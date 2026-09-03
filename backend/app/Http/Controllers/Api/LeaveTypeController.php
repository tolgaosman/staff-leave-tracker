<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;

class LeaveTypeController extends Controller
{
    /**
     * Tüm izin türlerini listeler (frontend'deki izin talebi formu açılır menüsü
     * ve slug -> id eşlemesi için).
     */
    public function index()
    {
        return response()->json(LeaveType::orderBy('id')->get());
    }
}
