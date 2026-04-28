import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, LogOut, PencilLine, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, UserPlus, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EMPTY_FORM = {
  email: "",
  password: "",
  name: "",
  division: "",
  role: "user",
};

export default function NebworkAdmin() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({
    email: "",
    name: "",
    division: "",
    role: "user",
  });

  const token = sessionStorage.getItem("token");
  const sessionUser = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }, []);

  const fetchAdminData = async (query = "") => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const employeeUrl = new URL(ADMIN_ENDPOINTS.EMPLOYEES);
      if (query.trim()) {
        employeeUrl.searchParams.set("search", query.trim());
      }

      const [employeeResponse, analyticsResponse] = await Promise.all([
        fetch(employeeUrl.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(ADMIN_ENDPOINTS.ANALYTICS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const employeeData = await employeeResponse.json();
      const analyticsData = await analyticsResponse.json();

      if (!employeeResponse.ok) {
        throw new Error(employeeData.message || "Failed to load employees");
      }

      if (!analyticsResponse.ok) {
        throw new Error(analyticsData.message || "Failed to load admin analytics");
      }

      setEmployees(employeeData.data || []);
      setAnalytics(analyticsData);
    } catch (loadError) {
      setError(loadError.message || "Failed to load admin dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchAdminData(searchValue);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  const summary = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((employee) => employee.isActive !== false).length;
    const blocked = employees.filter((employee) => employee.isActive === false).length;
    const admins = employees.filter((employee) => employee.role === "admin").length;

    return [
      { label: "Employees", value: total, detail: "Akun pekerja yang saat ini tersedia." },
      { label: "Active", value: active, detail: "Akun yang bisa login dan memakai worklog." },
      { label: "Blocked", value: blocked, detail: "Akun yang saat ini diblokir dari sistem." },
      { label: "Admins", value: admins, detail: "Akun yang punya akses dashboard admin." },
    ];
  }, [employees]);

  const divisionSnapshot = analytics?.worklogsPerDivision || [];

  const handleCreateEmployee = async () => {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create employee");
      }

      setCreateForm(EMPTY_FORM);
      setCreateOpen(false);
      await fetchAdminData(searchValue);
    } catch (submitError) {
      setError(submitError.message || "Failed to create employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      email: employee.email || "",
      name: employee.name || "",
      division: employee.division || "",
      role: employee.role || "user",
    });
    setEditOpen(true);
  };

  const handleEditEmployee = async () => {
    if (!token || !selectedEmployee?._id) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEE(selectedEmployee._id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update employee");
      }

      setEditOpen(false);
      setSelectedEmployee(null);
      await fetchAdminData(searchValue);
    } catch (submitError) {
      setError(submitError.message || "Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (!token || !employee?._id) {
      return;
    }

    if (!window.confirm(`Delete ${employee.name}?`)) {
      return;
    }

    setError("");

    try {
      const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEE(employee._id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete employee");
      }

      await fetchAdminData(searchValue);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete employee");
    }
  };

  const handleToggleStatus = async (employee) => {
    if (!token || !employee?._id) {
      return;
    }

    setError("");

    try {
      const response = await fetch(ADMIN_ENDPOINTS.TOGGLE_STATUS(employee._id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update employee status");
      }

      await fetchAdminData(searchValue);
    } catch (toggleError) {
      setError(toggleError.message || "Failed to update employee status");
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(AUTH_ENDPOINTS.LOGOUT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_44%,#eef4ff_100%)] text-foreground">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Register employee account</DialogTitle>
            <DialogDescription>
              Buat akun pekerja baru langsung dari dashboard admin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6">
            <Input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="h-11 rounded-2xl bg-white" />
            <Input value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@nebwork.id" className="h-11 rounded-2xl bg-white" />
            <Input type="password" value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} placeholder="Temporary password" className="h-11 rounded-2xl bg-white" />
            <Input value={createForm.division} onChange={(event) => setCreateForm((current) => ({ ...current, division: event.target.value }))} placeholder="Division / Team" className="h-11 rounded-2xl bg-white" />
            <div className="flex flex-wrap gap-2">
              {["user", "admin"].map((role) => (
                <Button
                  key={role}
                  variant={createForm.role === role ? "default" : "outline"}
                  className={createForm.role === role ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)]" : "rounded-full"}
                  onClick={() => setCreateForm((current) => ({ ...current, role }))}
                >
                  {role}
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-2xl" onClick={handleCreateEmployee} disabled={isSubmitting}>
                Save account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Edit employee account</DialogTitle>
            <DialogDescription>
              Perbarui data akun tanpa mengubah worklog yang sudah dimiliki.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-6">
            <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" className="h-11 rounded-2xl bg-white" />
            <Input value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@nebwork.id" className="h-11 rounded-2xl bg-white" />
            <Input value={editForm.division} onChange={(event) => setEditForm((current) => ({ ...current, division: event.target.value }))} placeholder="Division / Team" className="h-11 rounded-2xl bg-white" />
            <div className="flex flex-wrap gap-2">
              {["user", "admin"].map((role) => (
                <Button
                  key={role}
                  variant={editForm.role === role ? "default" : "outline"}
                  className={editForm.role === role ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)]" : "rounded-full"}
                  onClick={() => setEditForm((current) => ({ ...current, role }))}
                >
                  {role}
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-2xl" onClick={handleEditEmployee} disabled={isSubmitting}>
                Update account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="mb-6 rounded-[32px] border border-border/60 bg-white/92 p-6 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white shadow-lg shadow-[#2563eb]/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">Admin only</p>
                <h1 className="font-display text-4xl leading-tight text-slate-900">Admin dashboard</h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  Kelola akun pekerja, role, status akses, dan pantau distribusi knowledge dari satu halaman khusus admin.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
                  Back
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => fetchAdminData(searchValue)}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" onClick={() => setCreateOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Register account
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-5 text-sm text-red-700">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <Card key={item.label} className="bg-white/[0.92]">
                <CardHeader className="pb-3">
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-3xl text-slate-900">{item.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <Card className="bg-white/[0.92]">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563eb]" />
                  <Input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="h-11 w-full rounded-2xl border-border/70 bg-white pl-9"
                    placeholder="Search by name, email, or division..."
                  />
                </div>

                {isLoading ? (
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                    Loading employee accounts...
                  </div>
                ) : null}

                {!isLoading && employees.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                    Belum ada akun yang cocok dengan pencarian ini.
                  </div>
                ) : null}

                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div key={employee._id} className="rounded-3xl border border-border/60 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={employee.isActive === false ? "outline" : "secondary"}>
                              {employee.isActive === false ? "Blocked" : "Active"}
                            </Badge>
                            <Badge variant="outline">{employee.role || "user"}</Badge>
                          </div>
                          <p className="font-display text-2xl text-slate-900">{employee.name}</p>
                          <p className="text-sm text-slate-500">{employee.email}</p>
                          <p className="text-sm text-slate-500">{employee.division}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" className="rounded-2xl" onClick={() => openEditEmployee(employee)}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="outline" className="rounded-2xl" onClick={() => handleToggleStatus(employee)}>
                            <ShieldCheck className="h-4 w-4" />
                            {employee.isActive === false ? "Unblock" : "Block"}
                          </Button>
                          <Button variant="outline" className="rounded-2xl text-red-600" onClick={() => handleDeleteEmployee(employee)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="bg-white/[0.92]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-5 w-5 text-[#2563eb]" />
                    Division snapshot
                  </CardTitle>
                  <CardDescription>Pembagian worklog aktif berdasarkan divisi yang ada di sistem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {divisionSnapshot.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                      Belum ada data divisi yang cukup.
                    </div>
                  ) : divisionSnapshot.map((item) => (
                    <div key={item.division} className="flex items-center justify-between rounded-2xl border border-border/60 bg-white px-4 py-3">
                      <span className="font-medium text-slate-900">{item.division}</span>
                      <span className="text-xs text-slate-500">{`${item.count} worklogs`}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/[0.92]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users2 className="h-5 w-5 text-[#2563eb]" />
                    Admin actions
                  </CardTitle>
                  <CardDescription>Fitur inti yang layak tersedia untuk admin Nebwork.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3">
                    Registrasi akun karyawan baru dengan domain Nebwork.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3">
                    Edit identitas akun, divisi, dan role admin atau user.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3">
                    Block atau unblock akun tanpa menghapus data knowledge yang sudah tersimpan.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3">
                    Pantau distribusi knowledge dan volume worklog per divisi.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
