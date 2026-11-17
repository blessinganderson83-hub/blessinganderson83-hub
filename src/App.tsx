import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Home from '@/pages/Home';
import SmartReply from '@/pages/SmartReply';
import Products from '@/pages/Products';
import Faqs from '@/pages/Faqs';
import Leads from '@/pages/Leads';
import Orders from '@/pages/Orders';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/reply"
          element={
            <Layout>
              <SmartReply />
            </Layout>
          }
        />
        <Route
          path="/products"
          element={
            <Layout>
              <Products />
            </Layout>
          }
        />
        <Route
          path="/faqs"
          element={
            <Layout>
              <Faqs />
            </Layout>
          }
        />
        <Route
          path="/leads"
          element={
            <Layout>
              <Leads />
            </Layout>
          }
        />
        <Route
          path="/orders"
          element={
            <Layout>
              <Orders />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  );
}
