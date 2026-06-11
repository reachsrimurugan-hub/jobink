import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/db';
import { CITIES, LOCATIONS } from '../utils/locations';
import Navbar from '../components/Navbar';
import { ArrowLeft, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

const PostJobPage = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState('');
  const [paymentType, setPaymentType] = useState('per day');
  const [city, setCity] = useState(currentUser?.city || '');
  const [area, setArea] = useState(currentUser?.area || '');
  const [workingHours, setWorkingHours] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState(1);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Please fill in the title and description.');
      return;
    }
    if (Number(payment) <= 0) {
      setError('Payment must be a positive amount.');
      return;
    }
    if (!city || !area) {
      setError('Please select both city and area.');
      return;
    }
    if (Number(workersNeeded) <= 0) {
      setError('At least 1 worker is required.');
      return;
    }

    try {
      setLoading(true);
      const jobData = {
        employerId: currentUser.uid,
        employerName: currentUser.name,
        employerPhone: currentUser.phone,
        title,
        description,
        payment: Number(payment),
        paymentType,
        location: `${city}, ${area}`,
        city,
        area,
        workingHours,
        workersNeeded: Number(workersNeeded)
      };

      await jobService.createJob(jobData);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to create job posting. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar activeTab="jobs" />
      
      <main className="max-w-xl mx-auto px-4 py-8">
        {/* Back navigation */}
        <button 
          type="button" 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-6 touch-target"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 text-left">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="font-extrabold text-slate-800 text-lg">Post Helper Requirement</h2>
            <p className="text-slate-500 text-xs mt-1">Specify task details, location, and payment to hire helpers</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-100 mb-5 flex items-start gap-1.5">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Job Title / Requirement
              </label>
              <input
                id="jobTitle"
                type="text"
                placeholder="e.g. Packing Helper, AC Servicing Assistant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-850 touch-target"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="jobDesc" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Describe the Manual Work
              </label>
              <textarea
                id="jobDesc"
                rows={4}
                placeholder="Describe responsibilities, size of boxes, floor number, details about tools needed, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-medium text-slate-700"
                required
                disabled={loading}
              />
            </div>

            {/* Payment Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="payAmt" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Payment (INR)
                </label>
                <input
                  id="payAmt"
                  type="number"
                  placeholder="e.g. 500"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-bold text-slate-800 touch-target"
                  required
                  min={1}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="payRate" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Payment Rate
                </label>
                <select
                  id="payRate"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-800 touch-target"
                  required
                  disabled={loading}
                >
                  <option value="per day">Per Day</option>
                  <option value="fixed">Fixed (One-Time)</option>
                </select>
              </div>
            </div>

            {/* Location (City & Area) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobCity" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  City
                </label>
                <select
                  id="jobCity"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setArea('');
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-850 touch-target"
                  required
                  disabled={loading}
                >
                  <option value="">Select City</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="jobArea" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Area / Neighborhood
                </label>
                <select
                  id="jobArea"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary bg-white text-sm font-semibold text-slate-850 touch-target"
                  required
                  disabled={loading || !city}
                >
                  <option value="">Select Area</option>
                  {city && LOCATIONS[city]?.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Working Hours & Workers Needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobHours" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Working Hours
                </label>
                <input
                  id="jobHours"
                  type="text"
                  placeholder="e.g. 9 AM - 6 PM, 4 Hours total"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-semibold text-slate-800 touch-target"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="workersNeed" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Workers Needed
                </label>
                <input
                  id="workersNeed"
                  type="number"
                  placeholder="e.g. 2"
                  value={workersNeeded}
                  onChange={(e) => setWorkersNeeded(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary text-sm font-bold text-slate-800 touch-target"
                  required
                  min={1}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !currentUser.verified}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-all touch-target flex items-center justify-center mt-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-transparent"
            >
              {loading 
                ? 'Creating Post...' 
                : !currentUser.verified 
                  ? 'Verification Required to Post Jobs' 
                  : 'Post Job Listing'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PostJobPage;
