<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;

class DepartmentController extends Controller
{
    /**
     * Tüm departmanları listeler (frontend'deki personel formu açılır menüsü için).
     */
    public function index()
    {
        return response()->json(Department::orderBy('id')->get());
    }

    /**
     * Belirli bir departmanın detaylarını ve içindeki personelleri getirir.
     */
    public function show(Department $department)
    {
        $department->load('personnels');
        return response()->json($department);
    }
}
