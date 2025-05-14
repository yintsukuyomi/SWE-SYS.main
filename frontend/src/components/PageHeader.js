import React from 'react';
import { Link } from 'react-router-dom';
import ExcelOperations from './ExcelOperations';

const PageHeader = ({
  title,
  subtitle,
  isAdmin,
  addButtonText,
  addButtonLink,
  onImport,
  onExport,
  templateData,
  templateFileName,
  backButtons = [],
  children
}) => {
  return (
    <div className="list-header">
      <div className="header-content">
        <h1>{title}</h1>
        <p className="list-subtitle">{subtitle}</p>
      </div>
      <div className="header-actions">
        {backButtons.map((button, index) => (
          <button
            key={index}
            className="back-button"
            onClick={button.onClick}
          >
            {button.text}
          </button>
        ))}
        {isAdmin && (
          <>
            {addButtonText && addButtonLink && (
              <Link to={addButtonLink} className="add-button">
                <span className="btn-icon">+</span> {addButtonText}
              </Link>
            )}
            {onImport && onExport && templateData && templateFileName && (
              <ExcelOperations
                onImport={onImport}
                onExport={onExport}
                templateData={templateData}
                templateFileName={templateFileName}
              />
            )}
          </>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader; 