<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\Personnel;
use App\Support\ManagerScope;

class DashboardController extends Controller
{
    /**
     * Dashboard ekranı için özet verileri hesaplar ve döndürür.
     */
    public function stats()
    {
        $user = request()->user();

        $personnelQuery = Personnel::query();
        $activeLeavesQuery = Personnel::where('status', 'on-leave');
        $pendingRequestsQuery = LeaveRequest::where('status', 'pending');
        $departmentQuery = Department::query();

        $deptId = ManagerScope::departmentIdFor($user);
        if ($deptId === false) {
            // manager'a bağlı personel kaydı yok — hiçbir şey görmesin
            $personnelQuery->where('id', 0);
            $activeLeavesQuery->where('id', 0);
            $pendingRequestsQuery->where('id', 0);
            $departmentQuery->where('id', 0);
        } elseif ($deptId !== null) {
            $personnelQuery->where('department_id', $deptId);
            $activeLeavesQuery->where('department_id', $deptId);
            $pendingRequestsQuery->whereHas('personnel', fn ($q) => $q->where('department_id', $deptId));
            $departmentQuery->where('id', $deptId);
        }

        return response()->json([
            'total_personnel' => $personnelQuery->count(),
            'active_leaves' => $activeLeavesQuery->count(),
            'pending_requests' => $pendingRequestsQuery->count(),
            'departments_count' => $departmentQuery->count(),
        ]);
    }
}
