import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import { useTranslation } from 'react-i18next';

export const getFileIcon = (fileUrl) => {
  const { t } = useTranslation();
  
  if (!fileUrl) return <InsertDriveFileIcon sx={{ fontSize: 20 }} titleAccess={t('unknown_file')} />;

  const extension = fileUrl.split('.').pop().toLowerCase();

  switch (extension) {
    case 'pdf':
      return <PictureAsPdfIcon sx={{ fontSize: 20, color: '#E42101' }} titleAccess={t('pdf_file')} />;
    case 'doc':
    case 'docx':
      return <DescriptionIcon sx={{ fontSize: 20, color: '#2A5699' }} titleAccess={t('word_file')} />;
    case 'xls':
    case 'xlsx':
      return <TableChartIcon sx={{ fontSize: 20, color: '#207245' }} titleAccess={t('excel_file')} />;
    case 'txt':
      return <ArticleIcon sx={{ fontSize: 20, color: '#000' }} titleAccess={t('text_file')} />;
    case 'zip':
      return <FolderZipIcon sx={{ fontSize: 20, color: '#FFB000' }} titleAccess={t('zip_file')} />;
    default:
      return <InsertDriveFileIcon sx={{ fontSize: 20 }} titleAccess={t('file')} />;
  }
};