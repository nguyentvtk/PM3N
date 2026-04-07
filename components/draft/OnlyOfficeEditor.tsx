'use client';

import React, { useEffect, useRef } from 'react';

interface OnlyOfficeEditorProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  documentId: string;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
  fileUrl,
  fileName,
  fileType,
  documentId,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // OnlyOffice cần script từ server của nó
    const scriptUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_SERVER_URL + 'web-apps/apps/api/documents/api.js';
    
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      if (window.DocsAPI && editorRef.current) {
        new window.DocsAPI.DocEditor(editorRef.current.id, {
          document: {
            fileType: fileType,
            key: documentId,
            title: fileName,
            url: fileUrl,
          },
          documentType: getDocumentType(fileType),
          editorConfig: {
            callbackUrl: '', // API to handle save, normally a backend route
            lang: 'vi',
            mode: 'edit',
            user: {
              id: 'user-id',
              name: 'User Name',
            },
          },
          height: '600px',
          width: '100%',
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [fileUrl, fileName, fileType, documentId]);

  return <div id="docx-editor" ref={editorRef} className="w-full h-[600px] border rounded-lg overflow-hidden shadow-inner bg-slate-50" />;
};

function getDocumentType(ext: string): string {
  if (['doc', 'docx', 'odt', 'txt'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'cell';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'slide';
  return 'word';
}

export default OnlyOfficeEditor;

// Thêm declaration để TypeScript không báo lỗi DocsAPI
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DocsAPI: any;
  }
}
