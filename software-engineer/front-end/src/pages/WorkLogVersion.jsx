import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import FriendsList from "@/components/FriendsList/FriendsList";
import { WORKLOG_ENDPOINTS } from "../config/api";

// Helper to format field names to readable format
const formatFieldName = (fieldName) => {
  const fieldMap = {
    title: "Title",
    content: "Content",
    tag: "Tags",
    status: "Status",
    privacyLevel: "Privacy Level",
    project: "Project",
    department: "Department",
    summary: "Summary",
    collaborators: "Collaborators"
  };
  return fieldMap[fieldName] || fieldName;
};

// Helper to truncate long values for display
const truncateValue = (value, maxLength = 100) => {
  if (!value) return "N/A";
  const str = Array.isArray(value) ? value.join(", ") : String(value);
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

const WorkLogVersion = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // id WorkLog nya
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [versions, setVersions] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [expandedVersionId, setExpandedVersionId] = useState(null);


  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(WORKLOG_ENDPOINTS.VERSIONS(id), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();

        setVersions(data?.versions ?? []);  // fallback aman
        setTitle(data?.title ?? "");
      } catch (err) {
        console.error("fetchVersions error:", err);
      }
    };

    if (!id) return;

    fetchVersions();
  }, [id]);

  const fetchSingleHistory = async (hid) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(WORKLOG_ENDPOINTS.LOGHISTORY_ONE(hid), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    setSelectedHistory(data);
  };


  return (
    <div className="flex h-screen bg-background">
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-foreground"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-3xl font-bold">📜 Version History - {title}</h1>
            </div>

            <div className="space-y-4 max-w-5xl">
              {Array.isArray(versions) && versions.length > 0 ? (
                versions.map((v, idx) => (
                  <div key={v._id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <img
                            src={v.user?.profile_photo ?? "/placeholder.jpeg"}
                            alt={v.user?.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/10"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{v.user?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {v.user?.division}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(v.datetime).toLocaleString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {idx === 0 && <span className="bg-blue-500/20 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">Latest</span>}
                          <div className="text-sm text-muted-foreground italic">
                            Version {versions.length - idx}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-base text-foreground mb-4 pl-[72px]">{v.message}</p>

                      {/* Changes summary */}
                      {v.changedFields && v.changedFields.length > 0 && (
                        <div className="pl-[72px] mb-4">
                          <div className="bg-muted/40 rounded px-3 py-2 text-sm">
                            <span className="font-semibold text-foreground">{v.changedFields.length} field{v.changedFields.length > 1 ? 's' : ''} changed:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {v.changedFields.map((change, idx) => (
                                <span key={idx} className="bg-blue-500/20 text-blue-700 text-xs px-2 py-1 rounded">
                                  {formatFieldName(change.fieldName)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expandable changes detail */}
                    {v.changedFields && v.changedFields.length > 0 && (
                      <div className="border-t border-border">
                        <button
                          onClick={() => setExpandedVersionId(expandedVersionId === v._id ? null : v._id)}
                          className="w-full px-6 py-3 bg-muted/20 hover:bg-muted/40 flex items-center justify-between text-sm font-medium transition-colors"
                        >
                          <span>View Changes Details</span>
                          {expandedVersionId === v._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        
                        {expandedVersionId === v._id && (
                          <div className="px-6 py-4 bg-muted/10 space-y-3">
                            {v.changedFields.map((change, idx) => (
                              <div key={idx} className="border-l-2 border-blue-500 pl-4 py-2">
                                <p className="font-semibold text-sm text-foreground mb-2">
                                  {formatFieldName(change.fieldName)}
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-1">Previous:</p>
                                    <div className="bg-red-500/10 text-red-700 p-2 rounded border border-red-500/20">
                                      {truncateValue(change.oldValue, 150)}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-medium mb-1">Current:</p>
                                    <div className="bg-green-500/10 text-green-700 p-2 rounded border border-green-500/20">
                                      {truncateValue(change.newValue, 150)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action bar at the bottom */}
                    <div className="bg-muted/30 px-6 py-3 flex items-center justify-end border-t border-border">
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={async () => {
                          await fetchSingleHistory(v._id);
                          navigate(`/blog-post?id=${id}`, {
                            state: {
                              snapshot: v.snapshot,
                              historyId: v._id
                            }
                          });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View This Version
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No version history yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Version history will appear when you make changes to this worklog</p>
                </div>
              )}
            </div>
          </div>

          <FriendsList/>
        </div>
      </main>
    </div>
  );
};

export default WorkLogVersion;


