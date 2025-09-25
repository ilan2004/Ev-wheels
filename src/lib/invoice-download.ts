import { Invoice } from '@/types/billing';

// Function to generate PDF from HTML content
export async function downloadInvoiceAsPDF(invoice: Invoice, htmlContent: string) {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker.');
    }

    // Write the HTML content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.number}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              color: #374151;
              background: white;
            }
            
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
              
              .page-break {
                page-break-after: always;
              }
              
              @page {
                margin: 0.5in;
                size: A4;
              }
            }
            
            /* Tailwind CSS classes - essential ones only */
            .max-w-4xl { max-width: 56rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .bg-white { background-color: white; }
            .text-gray-900 { color: #111827; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-green-600 { color: #059669; }
            .text-blue-600 { color: #2563eb; }
            .text-red-600 { color: #dc2626; }
            .text-green-100 { color: #dcfce7; }
            
            .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
            .from-green-50 { --tw-gradient-from: #f0fdf4; }
            .to-blue-50 { --tw-gradient-to: #eff6ff; }
            .from-green-500 { --tw-gradient-from: #10b981; }
            .to-blue-600 { --tw-gradient-to: #2563eb; }
            .via-blue-500 { --tw-gradient-via: #3b82f6; }
            
            .p-8 { padding: 2rem; }
            .p-6 { padding: 1.5rem; }
            .p-4 { padding: 1rem; }
            .p-3 { padding: 0.75rem; }
            .pb-6 { padding-bottom: 1.5rem; }
            .pt-8 { padding-top: 2rem; }
            .pt-6 { padding-top: 1.5rem; }
            .pt-3 { padding-top: 0.75rem; }
            .pt-2 { padding-top: 0.5rem; }
            .pb-2 { padding-bottom: 0.5rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            
            .mb-8 { margin-bottom: 2rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            
            .flex { display: flex; }
            .grid { display: grid; }
            .hidden { display: none; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .justify-end { justify-content: flex-end; }
            
            .space-y-8 > * + * { margin-top: 2rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-x-6 > * + * { margin-left: 1.5rem; }
            .space-x-3 > * + * { margin-left: 0.75rem; }
            
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            
            .rounded-lg { border-radius: 0.5rem; }
            .rounded { border-radius: 0.25rem; }
            
            .border { border-width: 1px; border-color: #d1d5db; }
            .border-t { border-top-width: 1px; border-color: #d1d5db; }
            .border-b { border-bottom-width: 1px; border-color: #d1d5db; }
            .border-b-2 { border-bottom-width: 2px; }
            .border-t-2 { border-top-width: 2px; }
            .border-gray-100 { border-color: #f3f4f6; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-green-200 { border-color: #bbf7d0; }
            .border-blue-200 { border-color: #bfdbfe; }
            .border-red-200 { border-color: #fecaca; }
            
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-red-50 { background-color: #fef2f2; }
            .bg-green-100 { background-color: #dcfce7; }
            .bg-blue-100 { background-color: #dbeafe; }
            .bg-red-100 { background-color: #fee2e2; }
            .bg-green-800 { background-color: #166534; }
            .bg-blue-800 { background-color: #1e40af; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-red-800 { background-color: #991b1b; }
            
            .w-full { width: 100%; }
            .w-16 { width: 4rem; }
            .w-10 { width: 2.5rem; }
            .h-16 { height: 4rem; }
            .h-10 { height: 2.5rem; }
            .h-1 { height: 0.25rem; }
            .max-w-md { max-width: 28rem; }
            .max-w-xs { max-width: 20rem; }
            
            .overflow-hidden { overflow: hidden; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            .whitespace-pre-line { white-space: pre-line; }
            
            .opacity-50 { opacity: 0.5; }
            .opacity-30 { opacity: 0.3; }
            
            table { border-collapse: collapse; }
            th, td { text-align: left; vertical-align: top; }
            .w-20 { width: 5rem; }
            .w-28 { width: 7rem; }
            
            .backdrop-blur-sm { backdrop-filter: blur(4px); }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            
            /* Custom gradients */
            .bg-gradient-to-br { 
              background: linear-gradient(to bottom right, var(--tw-gradient-stops)); 
            }
            .from-green-500.to-blue-600 {
              background: linear-gradient(135deg, #10b981 0%, #2563eb 100%);
            }
            .from-green-50.to-blue-50 {
              background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
            }
            .from-green-500.via-blue-500.to-green-500 {
              background: linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #10b981 100%);
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
            <button onclick="window.print()" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Print</button>
            <button onclick="window.close()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Close</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then focus
    setTimeout(() => {
      printWindow.focus();
    }, 500);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Function to trigger direct browser print dialog
export function printInvoice(invoice: Invoice, htmlContent: string) {
  try {
    // Create a temporary div
    const printDiv = document.createElement('div');
    printDiv.innerHTML = htmlContent;
    
    // Hide current content
    const originalContent = document.body.innerHTML;
    
    // Replace with print content
    document.body.innerHTML = printDiv.innerHTML;
    
    // Print
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContent;
    
    // Reload the page to restore React state
    window.location.reload();
  } catch (error) {
    console.error('Error printing invoice:', error);
    throw error;
  }
}

// Function to download as HTML file
export function downloadInvoiceAsHTML(invoice: Invoice, htmlContent: string) {
  try {
    const fullHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.number}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    /* Include the same styles as above for consistency */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.5; color: #374151; background: white; }
    /* Add all the Tailwind classes here */
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    const blob = new Blob([fullHtmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading HTML:', error);
    throw error;
  }
}
