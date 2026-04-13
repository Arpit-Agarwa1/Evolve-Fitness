import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import Trainers from "./pages/Trainers";
import Membership from "./pages/Membership";
import Contact from "./pages/Contact";
import Register from "./pages/Register";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminLeads from "./pages/admin/AdminLeads";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

function App() {
  return (
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
    </Routes>
  );
}

export default App;
