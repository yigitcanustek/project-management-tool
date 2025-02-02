import React, { useState } from "react";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { useNavigate, Outlet } from "react-router-dom";

const { Content, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

// Utility to create menu items
function getItem(
  label: React.ReactNode,
  key: React.Key,
  onClick?: () => void
): MenuItem {
  return { key, label, onClick } as MenuItem;
}

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const items: MenuItem[] = [
    getItem("Dashboard", "dashboard", () => navigate("/")),
    getItem("Board", "board", () => navigate("/board")),
    getItem("Workflow", "workflow", () => navigate("/workflow")),
  ];

  return (
    <Layout style={{ height: "100vh", width: "100vw" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={{ color: "white", textAlign: "center", padding: "16px" }}>
          <h2 style={{ color: "#fff", margin: 0 }}>My App</h2>
        </div>
        <Menu theme="dark" mode="inline" items={items} />
      </Sider>
      <Layout>
        <Content style={{ margin: 5 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
