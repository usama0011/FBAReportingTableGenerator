import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  message,
  Table,
  Spin,
} from "antd";
import "./App.css";
import axios from "axios";
import moment from "moment/moment";
const { RangePicker } = DatePicker;

const App = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const onFinish = (values) => {
    setLoading(true);

    // Extract values from the form
    const { offerID, affiliateID, dateRange, timezoneID, ...staticData } =
      values;

    if (!dateRange || dateRange.length < 2) {
      message.error("Please select a valid date range");
      setLoading(false);
      return;
    }

    const from = dateRange[0];
    const to = dateRange[1];

    // Call fetchReportingData with form values
    fetchReportingData({
      from,
      to,
      staticData,
      timezoneId: timezoneID,
      offerId: offerID,
      affiliateId: affiliateID,
    });
  };
  const platformColors = {
    Android: "#ffcccc", // Light Red
    macOS: "#ccffcc", // Light Green
    Windows: "#ccccff", // Light Blue
    iOS: "#ffffcc", // Light Yellow
    iPad: "#ffccff", // Light Pink
  };

  const impressionDeviceColors = {
    Feed: "#d9ead3", // Light Green
    Video_feeds: "#c9daf8", // Light Blue
    "Facebook Stories": "#f4cccc", // Light Red
    Marketplace: "#ffe599", // Light Orange
    Search: "#b4a7d6", // Light Purple
  };

  const fetchReportingData = async ({
    from,
    to,
    staticData,
    timezoneId,
    offerId,
    affiliateId,
  }) => {
    setLoading(true);
    const payload = {
      timezone_id: Number(timezoneId),
      currency_id: "USD",
      from: from.format("YYYY-MM-DD"),
      to: to.format("YYYY-MM-DD"),
      columns: [
        { column: "offer" },
        { column: "affiliate" },
        { column: "date" },
        { column: "platform" },
      ],
      usm_columns: [],
      query: {
        filters: [
          { resource_type: "offer", filter_id_value: String(offerId) },
          { resource_type: "affiliate", filter_id_value: String(affiliateId) },
        ],
        exclusions: [],
        metric_filters: [],
        user_metrics: [],
        settings: {},
      },
    };

    try {
      const response = await axios.post(
        "https://api.eflow.team/v1/networks/reporting/entity",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Eflow-API-Key": process.env.XEflowAPIKey,
          },
        }
      );
      console.log(response.data);

      if (response.data && response.data.table) {
        const formattedData = [];
        const allowedPlatforms = ["Android", "macOS", "Windows", "iOS", "iPad"]; // ✅ Allowed platforms
        const impressionDevicesList = [
          "Facebook Stories",
          "Feed",
          "Marketplace",
          "Search",
          "Video_feeds",
        ];
        const impressionDevices = [
          { name: "Feed", percentage: 0.55 },
          { name: "Video_feeds", percentage: 0.07 },
          { name: "Facebook Stories", percentage: 0.13 },
          { name: "Marketplace", percentage: 0.19 },
          { name: "Search", percentage: 0.06 },
        ];

        response.data.table.forEach((item, index) => {
          const date = moment
            .unix(item.columns.find((col) => col.column_type === "date")?.id)
            .format("YYYY-MM-DD");

          const offer =
            item.columns.find((col) => col.column_type === "offer")?.label ||
            "N/A";
          const affiliate =
            item.columns.find((col) => col.column_type === "affiliate")
              ?.label || "N/A";
          const platform =
            item.columns.find((col) => col.column_type === "platform")?.label ||
            "N/A";
          let totalClicks = item.reporting.total_click || 0;

          // ✅ Skip platforms that are NOT in the allowed list
          if (!allowedPlatforms.includes(platform)) {
            return; // ❌ Ignore and continue loop
          }

          // If macOS, split 60% here and 40% for iPad
          let iPadClicks = 0;
          if (platform === "macOS") {
            iPadClicks = Math.floor(totalClicks * 0.6); // 40% for iPad
            totalClicks = Math.ceil(totalClicks * 0.4); // 60% remains in macOS
          }

          // ✅ Add the main row for the platform
          formattedData.push({
            key: `${index}-main`,
            date,
            offer,
            affiliate,
            platform,
            totalClicks,
            pageID: staticData.pageID,
            pageName: staticData.pageName,
            campaignName: staticData.campaignName,
            adSetName: staticData.adSetName,
            adName: staticData.adName,
            adCreative: staticData.adCreative,
            impressionDevices: "All", // New column
          });

          // ✅ Distribute "All" clicks among impression devices
          impressionDevices.forEach((device, deviceIndex) => {
            const deviceClicks = Math.round(totalClicks * device.percentage); // Apply percentage

            formattedData.push({
              key: `${index}-impression-${deviceIndex}`,
              date,
              offer,
              affiliate,
              platform, // Keep platform repeated
              totalClicks: deviceClicks, // Assigned based on percentage
              pageID: staticData.pageID,
              pageName: staticData.pageName,
              campaignName: staticData.campaignName,
              adSetName: staticData.adSetName,
              adName: staticData.adName,
              adCreative: staticData.adCreative,
              impressionDevices: device.name, // Assign different devices
            });
          });

          // ✅ Add iPad platform with 40% of macOS clicks
          if (iPadClicks > 0) {
            formattedData.push({
              key: `${index}-ipad-main`,
              date,
              offer,
              affiliate,
              platform: "iPad",
              totalClicks: iPadClicks,
              pageID: staticData.pageID,
              pageName: staticData.pageName,
              campaignName: staticData.campaignName,
              adSetName: staticData.adSetName,
              adName: staticData.adName,
              adCreative: staticData.adCreative,
              impressionDevices: "All",
            });

            // ✅ Distribute iPad clicks among impression devices
            impressionDevices.forEach((device, deviceIndex) => {
              const deviceClicks = Math.round(iPadClicks * device.percentage); // Apply percentage

              formattedData.push({
                key: `${index}-ipad-impression-${deviceIndex}`,
                date,
                offer,
                affiliate,
                platform: "iPad",
                totalClicks: deviceClicks,
                pageID: staticData.pageID,
                pageName: staticData.pageName,
                campaignName: staticData.campaignName,
                adSetName: staticData.adSetName,
                adName: staticData.adName,
                adCreative: staticData.adCreative,
                impressionDevices: device.name,
              });
            });
          }
        });

        // Sort by date
        formattedData.sort(
          (a, b) =>
            moment(a.date, "YYYY-MM-DD").unix() -
            moment(b.date, "YYYY-MM-DD").unix()
        );

        setReportData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Page ID", dataIndex: "pageID", key: "pageID" },
    { title: "Page Name", dataIndex: "pageName", key: "pageName" },
    { title: "Campaign Name", dataIndex: "campaignName", key: "campaignName" },
    { title: "Ad Set Name", dataIndex: "adSetName", key: "adSetName" },
    { title: "Ad Creative", dataIndex: "adCreative", key: "adCreative" },
    { title: "Ad Name", dataIndex: "adName", key: "adName" },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      render: (text) => (
        <span
          style={{
            backgroundColor: platformColors[text] || "white",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Impression Devices",
      dataIndex: "impressionDevices",
      key: "impressionDevices",
      render: (text) => (
        <span
          style={{
            backgroundColor: impressionDeviceColors[text] || "white",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Link Clicks",
      dataIndex: "totalClicks",
      key: "totalClicks",
      width: 200,
    },
    { title: "Amount Spent", dataIndex: "", key: "", width: 200 },
    { title: "Impressions", dataIndex: "", key: "", width: 200 },
    { title: "Reach", dataIndex: "", key: "", width: 200 },
    { title: "Amount Spent", dataIndex: "", key: "", width: 200 },
    { title: "CPC (cost per link click)", dataIndex: "", key: "", width: 200 },
    {
      title: "CPM (cost per 1,000 impressions)",
      dataIndex: "",
      key: "",
      width: 200,
    },
    { title: "CTR (all)", dataIndex: "", key: "", width: 200 },
  ];
  return (
    <div className="container">
      <h2>Ad Campaign Form</h2>
      <Form requiredMark={false} layout="vertical" onFinish={onFinish}>
        {/* First Row: Offer ID, Affiliate ID, Date Range, Timezone ID */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Offer ID"
              name="offerID"
              rules={[{ required: true, message: "Please enter Offer ID" }]}
            >
              <Input type="number" placeholder="Enter Offer ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Affiliate ID"
              name="affiliateID"
              rules={[{ required: true, message: "Please enter Affiliate ID" }]}
            >
              <Input type="number" placeholder="Enter Affiliate ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Date Range"
              name="dateRange"
              rules={[{ required: true, message: "Please select Date Range" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Timezone ID"
              name="timezoneID"
              rules={[{ required: true, message: "Please enter Timezone ID" }]}
            >
              <Input type="number" placeholder="Enter Timezone ID" />
            </Form.Item>
          </Col>
        </Row>

        {/* Second Row: Page ID, Page Name, Campaign Name, Ad Set Name */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Page ID"
              name="pageID"
              rules={[{ required: true, message: "Please enter Page ID" }]}
            >
              <Input type="number" placeholder="Enter Page ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Page Name"
              name="pageName"
              rules={[{ required: true, message: "Please enter Page Name" }]}
            >
              <Input placeholder="Enter Page Name" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Campaign Name"
              name="campaignName"
              rules={[
                { required: true, message: "Please enter Campaign Name" },
              ]}
            >
              <Input placeholder="Enter Campaign Name" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Ad Set Name"
              name="adSetName"
              rules={[{ required: true, message: "Please enter Ad Set Name" }]}
            >
              <Input placeholder="Enter Ad Set Name" />
            </Form.Item>
          </Col>
        </Row>

        {/* Third Row: Ad Name, Ad Creative */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Ad Name"
              name="adName"
              rules={[{ required: true, message: "Please enter Ad Name" }]}
            >
              <Input placeholder="Enter Ad Name" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Ad Creative"
              name="adCreative"
              rules={[{ required: true, message: "Please enter Ad Creative" }]}
            >
              <Input placeholder="Enter Ad Creative" />
            </Form.Item>
          </Col>
        </Row>

        {/* Submit Button */}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          rowClassName={(record) => {
            return platformColors[record.platform]
              ? "platform-row"
              : "impression-device-row";
          }}
          scroll={{ x: "max-content", y: "auto" }} // ✅ Enable horizontal scrolling
          dataSource={reportData}
          className="custom-table"
          columns={columns}
          pagination={false}
        />
      )}
    </div>
  );
};

export default App;
