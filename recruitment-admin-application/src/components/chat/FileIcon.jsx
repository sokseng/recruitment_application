import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderZipIcon from '@mui/icons-material/FolderZip';

export const getFileIcon = (fileUrl) => {
  if (!fileUrl) return <InsertDriveFileIcon sx={{ fontSize: 20 }} />;

  const extension = fileUrl.split('.').pop().toLowerCase();

  switch (extension) {
    case 'pdf':
      return <PictureAsPdfIcon sx={{ fontSize: 20, color: '#E42101' }} />;
    case 'doc':
    case 'docx':
      return <DescriptionIcon sx={{ fontSize: 20, color: '#2A5699' }} />;
    case 'xls':
    case 'xlsx':
      return <TableChartIcon sx={{ fontSize: 20, color: '#207245' }} />;
    case 'txt':
      return <ArticleIcon sx={{ fontSize: 20, color: '#000' }} />;
    case 'zip':
      return <FolderZipIcon sx={{ fontSize: 20, color: '#FFB000' }} />; // fallback
    default:
      return <InsertDriveFileIcon sx={{ fontSize: 20 }} />;
  }
};
