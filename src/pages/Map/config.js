const columns = [
  {
    title: "签约公司",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "国内播出",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "签约时间",
    dataIndex: "time",
    key: "time",
  },
  {
    title: "签约币种",
    dataIndex: "currency",
    key: "currency",
  },
  {
    title: "单集价格",
    dataIndex: "price",
    key: "price",
    render: (v) => (v ? Number(v).toLocaleString() : 0),
  },
];

export { columns };
