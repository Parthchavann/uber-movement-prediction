// Export utilities for dashboard data

export interface ExportData {
  predictions: any[];
  cities: any[];
  metrics: any;
  timestamp: string;
  selectedCity: string;
}

// Export data as JSON
export const exportAsJSON = (data: ExportData, filename?: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `uberflow-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export data as CSV
export const exportAsCSV = (predictions: any[], filename?: string) => {
  if (!predictions || predictions.length === 0) {
    throw new Error('No data to export');
  }

  // CSV headers
  const headers = [
    'City',
    'Segment ID',
    'Timestamp',
    'Predicted Speed (mph)',
    'Confidence Lower',
    'Confidence Upper',
    'Is Rush Hour',
    'Latitude',
    'Longitude'
  ];

  // Convert data to CSV format
  const csvData = predictions.map(pred => [
    pred.city || '',
    pred.segment_id || '',
    pred.timestamp || '',
    pred.predicted_speed || 0,
    pred.confidence_lower || 0,
    pred.confidence_upper || 0,
    pred.is_rush_hour ? 'Yes' : 'No',
    pred.lat || 0,
    pred.lon || 0
  ]);

  // Combine headers and data
  const csvContent = [headers, ...csvData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `uberflow-predictions-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export dashboard as PDF (basic HTML to PDF)
export const exportAsPDF = async (elementId: string, filename?: string) => {
  try {
    // This would normally use a library like jsPDF or html2pdf
    // For now, we'll use the browser's print functionality
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>UberFlow Analytics Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .no-print { display: none; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>UberFlow Analytics Dashboard</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);

  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};

// Generate summary report
export const generateSummaryReport = (data: ExportData): string => {
  const { predictions, cities, metrics, selectedCity, timestamp } = data;
  
  const totalPredictions = predictions.length;
  const avgSpeed = predictions.reduce((sum, p) => sum + (p.predicted_speed || 0), 0) / totalPredictions;
  const rushHourCount = predictions.filter(p => p.is_rush_hour).length;
  const cityCount = Array.from(new Set(predictions.map(p => p.city))).length;

  return `
UberFlow Analytics Summary Report
===============================

Generated: ${new Date(timestamp).toLocaleString()}
Selected Location: ${selectedCity === 'all' ? 'All Cities' : selectedCity.replace('_', ' ').toUpperCase()}

METRICS OVERVIEW
--------------
• Total Predictions: ${totalPredictions.toLocaleString()}
• Average Speed: ${avgSpeed.toFixed(1)} mph
• Rush Hour Segments: ${rushHourCount} (${((rushHourCount / totalPredictions) * 100).toFixed(1)}%)
• Cities Monitored: ${cityCount}
• Active Segments: ${metrics?.activeSegments || 0}
• Model Accuracy: ${metrics?.accuracy || 0}%

PERFORMANCE STATISTICS
--------------------
• Fastest Segment: ${Math.max(...predictions.map(p => p.predicted_speed || 0)).toFixed(1)} mph
• Slowest Segment: ${Math.min(...predictions.map(p => p.predicted_speed || 0)).toFixed(1)} mph
• Average Response Time: ${metrics?.avgResponseTime || 0}ms

DATA SOURCE
----------
• API Endpoint: http://localhost:8002
• Data Format: Real-time predictions with confidence intervals
• Update Frequency: Every 10-15 seconds
• Powered by LSTM and GNN models

For more information, visit: http://localhost:3001
  `;
};

// Export summary as text file
export const exportSummary = (data: ExportData, filename?: string) => {
  const summary = generateSummaryReport(data);
  const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `uberflow-summary-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};