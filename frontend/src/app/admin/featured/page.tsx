'use client';

import { useState, useEffect } from 'react';

export default function FeaturedCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate=reviews`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await res.json();
      const allCourses = data.data || [];
      setCourses(allCourses);
      
      const initiallySelected = allCourses.filter((c: any) => c.isFeatured).map((c: any) => c.documentId);
      setSelectedIds(initiallySelected);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (documentId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        if (prev.length >= 5) {
          alert('You can only select up to 5 featured courses.');
          return prev;
        }
        return [...prev, documentId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const jwt = localStorage.getItem('jwt');
    try {
      // First, un-feature all currently featured that are not in selectedIds
      const toUnfeature = courses.filter(c => c.isFeatured && !selectedIds.includes(c.documentId));
      for (const c of toUnfeature) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${c.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
          body: JSON.stringify({ data: { isFeatured: false } })
        });
      }
      
      // Then, feature all in selectedIds
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
          body: JSON.stringify({ data: { isFeatured: true } })
        });
      }
      
      alert('Featured courses updated successfully!');
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Failed to update featured courses.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Featured Courses</h1>
        <p className="text-gray-400">Select exactly 5 courses to showcase on the homepage.</p>
      </div>
      
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Selected ({selectedIds.length}/5)</h2>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-sm text-white rounded-lg transition-colors"
            >
              {isExpanded ? 'Collapse List' : 'Expand List'}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {courses.map(course => {
              const reviews = course.reviews || [];
              const avgRating = reviews.length > 0 
                ? (reviews.reduce((acc: number, r: any) => acc + (r.overallRating || 0), 0) / reviews.length).toFixed(1)
                : 'No ratings yet';
                
              const isSelected = selectedIds.includes(course.documentId);
              
              return (
                <div 
                  key={course.documentId} 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500/50' 
                      : 'bg-slate-800 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(course.documentId)}
                      className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-slate-700"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-200">{course.courseTitle}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {course.courseType || 'Theory'}
                        </span>
                        <span className="text-xs text-yellow-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {avgRating} {reviews.length > 0 && `(${reviews.length} reviews)`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
