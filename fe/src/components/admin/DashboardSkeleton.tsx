import React from "react";

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* 2 Thẻ Thống kê Top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center shadow">
            {/* Lõi Loading Avatar/Icon */}
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse shrink-0"></div>
            {/* Khối content Loading */}
            <div className="ml-4 w-full">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Loading Area */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 pt-8">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-8 animate-pulse"></div>
        {/* Khối biểu đồ xám */}
        <div className="w-full h-80 bg-gray-50 flex items-end px-4 pb-4 rounded-lg relative overflow-hidden space-x-3">
          {/* Mock cột loading */}
          {[...Array(7)].map((_, i) => (
             <div 
               key={i} 
               className="w-1/6 bg-gray-200 animate-pulse rounded-t-sm"
               style={{ height: `${Math.max(20, Math.random() * 90)}%` }}
             ></div>
          ))}
          {/* Lớp overlay fade nhấp nháy cho toàn biểu đồ */}
          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
