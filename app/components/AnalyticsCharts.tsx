'use client';

import { useEffect, useState } from 'react';
import { Student } from '../types/student';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

interface AnalyticsChartsProps {
  students: Student[];
}

export default function AnalyticsCharts({ students }: AnalyticsChartsProps) {
  const [provinceData, setProvinceData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: []
  });
  
  const [ageData, setAgeData] = useState<ChartData<'pie'>>({
    labels: [],
    datasets: []
  });
  
  const [studentTypeData, setStudentTypeData] = useState<ChartData<'doughnut'>>({
    labels: [],
    datasets: []
  });
  
  const [countryData, setCountryData] = useState<ChartData<'pie'>>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (students.length === 0) return;

    // Process province data
    const provinceMap = new Map<string, number>();
    students.forEach(student => {
      const province = student.province || 'Unknown';
      provinceMap.set(province, (provinceMap.get(province) || 0) + 1);
    });

    // Sort provinces by count (descending)
    const sortedProvinces = Array.from(provinceMap.entries())
      .sort((a, b) => b[1] - a[1]);

    setProvinceData({
      labels: sortedProvinces.map(([province]) => province),
      datasets: [
        {
          label: 'Number of Students',
          data: sortedProvinces.map(([, count]) => count),
          backgroundColor: '#fc5d01',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    });

    // Process age data
    const ageGroups = {
      'Under 18': 0,
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45+': 0,
      'Unknown': 0
    };

    students.forEach(student => {
      if (!student.dob) {
        ageGroups['Unknown']++;
        return;
      }

      const birthDate = new Date(student.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) ageGroups['Under 18']++;
      else if (age >= 18 && age <= 24) ageGroups['18-24']++;
      else if (age >= 25 && age <= 34) ageGroups['25-34']++;
      else if (age >= 35 && age <= 44) ageGroups['35-44']++;
      else ageGroups['45+']++;
    });

    setAgeData({
      labels: Object.keys(ageGroups),
      datasets: [
        {
          data: Object.values(ageGroups),
          backgroundColor: [
            '#fc5d01',  // Cam đậm
            '#fedac2',  // Cam nhạt rất nhẹ
            '#fdbc94',  // Cam nhạt trung bình
            '#ffac7b',  // Cam sáng hơn
            '#fd7f33',  // Cam rực
            '#ffeee5',  // Lighter shade
          ],
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    });

    // Process student type data
    const typeMap = new Map<string, number>();
    students.forEach(student => {
      const type = student.type || 'class'; // Default to 'class' for backward compatibility
      const displayType = type === 'one-on-one' ? '1-1' : type === 'class' ? 'Class' : '2345';
      typeMap.set(displayType, (typeMap.get(displayType) || 0) + 1);
    });

    setStudentTypeData({
      labels: Array.from(typeMap.keys()),
      datasets: [
        {
          data: Array.from(typeMap.values()),
          backgroundColor: [
            '#fc5d01',  // Cam đậm
            '#fdbc94',  // Cam nhạt trung bình
            '#fd7f33',  // Cam rực
          ],
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    });
    
    // Process country data
    const countryMap = new Map<string, number>();
    students.forEach(student => {
      const country = student.country || 'Vietnam'; // Default to Vietnam if not specified
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    // Sort countries by count (descending)
    const sortedCountries = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1]);

    setCountryData({
      labels: sortedCountries.map(([country]) => country),
      datasets: [
        {
          data: sortedCountries.map(([, count]) => count),
          backgroundColor: [
            '#fc5d01',  // Cam đậm
            '#fedac2',  // Cam nhạt rất nhẹ
            '#fdbc94',  // Cam nhạt trung bình
            '#ffac7b',  // Cam sáng hơn
            '#fd7f33',  // Cam rực
          ],
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    });
  }, [students]);

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Student Distribution by Province',
        color: '#fc5d01',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Student Distribution by Age Group',
        color: '#fc5d01',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Student Distribution by Type',
        color: '#fc5d01',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };
  
  const countryOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Student Distribution by Country',
        color: '#fc5d01',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  // Calculate summary statistics
  const totalStudents = students.length;
  const uniqueProvinces = new Set(students.map(s => s.province)).size;
  const uniqueCountries = new Set(students.map(s => s.country || 'Vietnam')).size;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-[#fc5d01]">
          <h3 className="text-lg font-medium text-gray-900">Total Students</h3>
          <p className="mt-2 text-3xl font-bold text-[#fc5d01]">{totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-[#fdbc94]">
          <h3 className="text-lg font-medium text-gray-900">Provinces/Cities</h3>
          <p className="mt-2 text-3xl font-bold text-[#fc5d01]">{uniqueProvinces}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-[#fd7f33]">
          <h3 className="text-lg font-medium text-gray-900">Countries</h3>
          <p className="mt-2 text-3xl font-bold text-[#fc5d01]">{uniqueCountries}</p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Province Distribution */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-[#fc5d01] mb-4">Regional Distribution</h3>
          <div className="h-80">
            <Bar data={provinceData} options={chartOptions} />
          </div>
        </div>
        
        {/* Age Distribution */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-[#fc5d01] mb-4">Age Distribution</h3>
          <div className="h-80">
            <Pie data={ageData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-[#fc5d01] mb-4">Student Type Distribution</h3>
          <div className="h-80">
            <Doughnut data={studentTypeData} options={doughnutOptions} />
          </div>
        </div>
        
        {/* Country Distribution */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-[#fc5d01] mb-4">Country Distribution</h3>
          <div className="h-80">
            <Pie data={countryData} options={countryOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
