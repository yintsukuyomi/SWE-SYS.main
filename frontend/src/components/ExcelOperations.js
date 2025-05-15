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
    // Special template for teacher
    if (templateFileName === 'ogretmen_sablonu') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Öğretmen Şablonu');

      // Add headers (A1:J1)
      const headers = Object.keys(templateData[0]);
      worksheet.addRow(headers);

      // Add 10 empty rows for data (A2:J11)
      for (let i = 0; i < 10; i++) {
        worksheet.addRow(Array(headers.length).fill(''));
      }

      // A1:J1 gri ve kilitli
      for (let col = 1; col <= headers.length; col++) {
        const cell = worksheet.getCell(1, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' } // Gri
        };
        cell.protection = { locked: true };
      }

      // A2:J11 sarı ve kilitli değil
      for (let row = 2; row <= 100; row++) {
        for (let col = 1; col <= headers.length; col++) {
          const cell = worksheet.getCell(row, col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' } // Sarı
          };
          cell.protection = { locked: false };
        }
      }

      // Tüm diğer hücreler kilitli (varsayılan)
      worksheet.protect('sifre', {
        selectLockedCells: true,
        selectUnlockedCells: true
      });

      // Sütun genişliklerini ayarla (A-J)
      for (let col = 1; col <= headers.length; col++) {
        worksheet.getColumn(col).width = 22;
      }

      // Dosyayı indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    // Special template for courses
    if (templateFileName === 'ders_sablonu') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ders Şablonu');
      const headers = Object.keys(templateData[0]);
      worksheet.addRow(headers);
      for (let i = 0; i < 99; i++) {
        worksheet.addRow(Array(headers.length).fill(''));
      }
      // A1:N1 gri ve kilitli
      for (let col = 1; col <= 14; col++) {
        const cell = worksheet.getCell(1, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
        };
        cell.protection = { locked: true };
        worksheet.getColumn(col).width = 16;
      }
      // A2:N100 sarı ve kilitli değil
      for (let row = 2; row <= 100; row++) {
        for (let col = 1; col <= 14; col++) {
          const cell = worksheet.getCell(row, col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' }
          };
          cell.protection = { locked: false };
        }
      }
      worksheet.protect('sifre', {
        selectLockedCells: true,
        selectUnlockedCells: true
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    // Special template for classrooms
    if (templateFileName === 'derslik_sablonu') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Derslik Şablonu');
      const headers = Object.keys(templateData[0]);
      worksheet.addRow(headers);
      for (let i = 0; i < 99; i++) {
        worksheet.addRow(Array(headers.length).fill(''));
      }
      // A1:E1 gri ve kilitli
      for (let col = 1; col <= 5; col++) {
        const cell = worksheet.getCell(1, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
        };
        cell.protection = { locked: true };
        worksheet.getColumn(col).width = 22;
      }
      // A2:E100 sarı ve kilitli değil
      for (let row = 2; row <= 100; row++) {
        for (let col = 1; col <= 5; col++) {
          const cell = worksheet.getCell(row, col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' }
          };
          cell.protection = { locked: false };
        }
      }
      worksheet.protect('sifre', {
        selectLockedCells: true,
        selectUnlockedCells: true
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    // Default template logic for other templates
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