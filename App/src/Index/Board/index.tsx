import { Flex, Card } from "antd";
import React from "react";

export const Board: React.FC = () => {
  return (
    <Flex style={{ height: "100%" }} justify="center" align="center">
      <Card style={{ height: 600, width: 400 }}>sr</Card>
      <Card style={{ height: 600, width: 400 }}>s</Card>
      <Card style={{ height: 600, width: 400 }}>s</Card>
      <Card style={{ height: 600, width: 400 }}>s</Card>
    </Flex>
  );
};
