import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PageLoader from "./components/PageLoader";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const Programs = lazy(() => import("./pages/Programs"));
const Trainers = lazy(() => import("./pages/Trainers"));
const Membership = lazy(() => import("./pages/Membership"));
const Contact = lazy(() => import("./pages/Contact"));
const Register = lazy(() => import("./pages/Register"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminMemberPage = lazy(() => import("./pages/admin/AdminMemberPage"));
const AdminContacts = lazy(() => import("./pages/admin/AdminContacts"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminTrainers = lazy(() => import("./pages/admin/AdminTrainers"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <ProtectedAdminRoute>
              <AdminMembers />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/members/:id"
          element={
            <ProtectedAdminRoute>
              <AdminMemberPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/contacts"
          element={
            <ProtectedAdminRoute>
              <AdminContacts />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/leads"
          element={
            <ProtectedAdminRoute>
              <AdminLeads />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/trainers"
          element={
            <ProtectedAdminRoute>
              <AdminTrainers />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
