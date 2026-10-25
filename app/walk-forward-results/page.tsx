'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getWalkForwardOptimizationResultDetail } from '../AllApiCalls';
import { WalkForwardResultsView } from '@/components/walk-forward-results-view';

function WalkForwardResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'results' | 'graph' | 'report'>('results');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get result from URL params, sessionStorage, or fetch by ID
  useEffect(() => {
    const resultParam = searchParams.get('result');
    const idParam = searchParams.get('id');
    // A cloud job's id can also be a local run's; the history list says which.
    const throughDroplet = searchParams.get('source') === 'droplet';
    
    console.log('🔍 DEBUG: URL params - resultParam:', resultParam, 'idParam:', idParam);
    
    if (resultParam) {
      try {
        setResult(JSON.parse(decodeURIComponent(resultParam)));
      } catch (error) {
        console.error('Error parsing result from URL:', error);
      }
    } else if (idParam) {
      // Fetch the result by ID
      const fetchResult = async () => {
        try {
          setIsLoading(true);
          console.log('Fetching WFO result by ID:', idParam);
          const data = await getWalkForwardOptimizationResultDetail(parseInt(idParam), { throughDroplet });
          console.log('Fetched WFO result:', data);
          setResult(data);
        } catch (error) {
          console.error('Error fetching WFO result by ID:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResult();
    } else {
      // Check sessionStorage for optimization ID or minimal data
      const optimizationId = sessionStorage.getItem('walkForwardOptimizationId');
      const minimalData = sessionStorage.getItem('walkForwardMinimalData');
      
      console.log('🔍 DEBUG: SessionStorage - optimizationId:', optimizationId, 'minimalData:', minimalData);
      
      if (optimizationId) {
        // Fetch the result by optimization ID
        const fetchResult = async () => {
          try {
            setIsLoading(true);
            console.log('Fetching WFO result by optimization ID:', optimizationId);
            const data = await getWalkForwardOptimizationResultDetail(parseInt(optimizationId));
            console.log('Fetched WFO result:', data);
            setResult(data);
            // Clear the sessionStorage after successful fetch
            sessionStorage.removeItem('walkForwardOptimizationId');
          } catch (error) {
            console.error('Error fetching WFO result by optimization ID:', error);
          } finally {
            setIsLoading(false);
          }
        };
        fetchResult();
      } else if (minimalData) {
        try {
          const parsedData = JSON.parse(minimalData);
          console.log('Using minimal data from sessionStorage:', parsedData);
          setResult(parsedData);
          // Clear the sessionStorage after using
          sessionStorage.removeItem('walkForwardMinimalData');
        } catch (error) {
          console.error('Error parsing minimal data from sessionStorage:', error);
        }
      } else {
        // Fallback to localStorage - check both keys (for backward compatibility)
        const storedResult = localStorage.getItem('walkForwardResult') || localStorage.getItem('walkForwardResultDetail');
        console.log('🔍 DEBUG: localStorage fallback - storedResult:', storedResult ? 'exists' : 'not found');
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (error) {
            console.error('Error parsing result from localStorage:', error);
          }
        }
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#000] text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#85e1fe] mb-4">Loading Walk Forward Results...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#85e1fe] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="fixed inset-0 bg-[#000] text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#85e1fe] mb-4">No Walk Forward Results Found</div>
          <button 
            onClick={() => router.push('/strategy-testing')}
            className="bg-[#85e1fe] text-black px-6 py-3 rounded-md hover:bg-[#6bcae2] font-medium"
          >
            Go Back to Strategy Testing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#000] text-white flex flex-col z-50">
      {/* Sticky Full-Width Tab Bar */}
      <div className="sticky top-0 z-20 w-full bg-[#000]">
        <div className="flex w-full items-center px-8" style={{ minHeight: 48 }}>
          <div className="flex flex-1">
            {['results', 'graph', 'report'].map((t) => (
              <button
                key={t}
                className={`flex-1 py-2 text-lg font-semibold transition-colors duration-200
                  ${tab === t
                    ? 'bg-[#000] text-[#85e1fe]'
                    : 'bg-[#141721] text-gray-400'
                  }`}
                onClick={() => setTab(t as any)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Save Button below tab bar, right-aligned */}
      <div className="px-20 pb-4 flex justify-end gap-2">
        <button 
          onClick={() => router.push('/strategy-testing')} 
          className="bg-[#85e1fe] text-black px-3 py-1.5 rounded-md hover:bg-[#6bcae2] font-medium mt-2 text-sm"
        >
          Back to Strategy Testing
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <WalkForwardResultsView result={result} section={tab} />
      </div>
    </div>
  );
}

// Loading fallback component
function WalkForwardResultsLoading() {
  return (
    <div className="fixed inset-0 bg-[#000] text-white flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-2xl font-bold text-[#85e1fe] mb-4">Loading Walk Forward Results...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#85e1fe] mx-auto"></div>
      </div>
    </div>
  );
}

export default function WalkForwardResultsPage() {
  return (
    <Suspense fallback={<WalkForwardResultsLoading />}>
      <WalkForwardResultsContent />
    </Suspense>
  );
} 