"use client";

import { useCallback, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DownloadRecord,
  getHistory,
  deleteRecord,
  clearHistory,
} from "@/lib/history-manager";
import { Download, Trash2, History, RefreshCw } from "lucide-react";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function DownloadHistory() {
  const [history, setHistory] = useState<DownloadRecord[]>([]);

  // Load history on mount (client-side only)
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleRefresh = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteRecord(id);
    setHistory(getHistory());
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm("คุณต้องการลบประวัติทั้งหมดหรือไม่?")) {
      clearHistory();
      setHistory([]);
    }
  }, []);

  const handleRedownload = useCallback((record: DownloadRecord) => {
    window.open(record.url, "_blank");
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            ประวัติการดาวน์โหลด
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                ล้างทั้งหมด
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mb-2 opacity-50" />
            <p>ยังไม่มีประวัติการดาวน์โหลด</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>แพลตฟอร์ม</TableHead>
                <TableHead>รูปแบบ</TableHead>
                <TableHead>คุณภาพ</TableHead>
                <TableHead>ขนาด</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {record.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {record.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.format === "mp3" ? "default" : "secondary"}>
                      {record.format.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.quality}</TableCell>
                  <TableCell>{formatFileSize(record.fileSize)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(record.downloadedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRedownload(record)}
                        title="ดาวน์โหลดอีกครั้ง"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(record.id)}
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
