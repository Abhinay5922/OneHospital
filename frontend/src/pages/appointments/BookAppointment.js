/**
 * Book Appointment Page Component
 * Appointment booking form
 */

import React from 'react';
import { useParams } from 'react-router-dom';

const BookAppointment = () => {
  const { hospitalId, doctorId } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Book Appointment
        </h1>
        <p className="text-gray-600 mb-6">
          Complete appointment booking form with doctor and time selection.
        </p>
        
        <div className="text-sm text-gray-500">
          <p>Hospital ID: {hospitalId}</p>
          <p>Doctor ID: {doctorId}</p>
        </div>

        <div className="text-sm text-gray-500 mt-6">
          Features coming soon:
          <ul className="mt-2 space-y-1">
            <li>• Doctor and hospital information</li>
            <li>• Available time slots</li>
            <li>• Patient details form</li>
            <li>• Symptoms and urgency selection</li>
            <li>• Appointment confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;