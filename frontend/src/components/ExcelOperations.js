import React from 'react';
import ExcelJS from 'exceljs';
import '../styles/ExcelOperations.css';

const ExcelOperations = ({ 
  onImport, 
  onExport, 
  templateData, 
  templateFileName,
  importTitle = "Excel'den İçe Aktar",
  exportTitle = "Excel'e Aktar",
  templateTitle = "Şablon İndir"
}) => {
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.getWorksheet(1);
      const jsonData = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value;
          rowData[header] = cell.value;
        });
        jsonData.push(rowData);
      });
      
      onImport(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExport = async () => {
    onExport();
  };

  const handleTemplateDownload = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Şablon');
    
    // Add headers
    const headers = Object.keys(templateData[0]);
    worksheet.addRow(headers);
    
    // Add template data
    templateData.forEach(row => {
      worksheet.addRow(Object.values(row));
    });
    
    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateFileName}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="excel-operations">
      <div className="excel-buttons">
        <label className="excel-button import-button">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <span className="button-icon">📥</span>
          {importTitle}
        </label>

        <button className="excel-button export-button" onClick={handleExport}>
          <span className="button-icon">📤</span>
          {exportTitle}
        </button>

        <button className="excel-button template-button" onClick={handleTemplateDownload}>
          <span className="button-icon">📋</span>
          {templateTitle}
        </button>
      </div>
    </div>
  );
};

export default ExcelOperations; 