import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="h-full w-full snap-center relative flex justify-center items-center bg-black animate-pulse">
            <div className="w-full h-full bg-gray-800"></div>

            <div className="skeleton-info">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                    <div className="w-32 h-6 rounded bg-gray-700"></div>
                </div>
                <div className="w-full h-4 rounded bg-gray-700 mt-3"></div>
                <div className="w-4/5 h-4 rounded bg-gray-700 mt-2"></div>
                <div className="w-1/2 h-5 rounded bg-gray-700 mt-3"></div>
            </div>

            <div className="skeleton-progress">
                 <div className="w-full h-2 rounded-full bg-gray-700"></div>
            </div>

            <div className="skeleton-sidebar">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="w-12 h-12 rounded-full bg-gray-700"></div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
