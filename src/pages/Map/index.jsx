import React, { useEffect, useState, useRef } from "react";
import { Input, Table, Tree, Tag, Card } from "antd";
import featureData from "./world.zh.json";
import { Scatter } from "@antv/g2plot";
import lemonIcon from "../../assets/icon/icon-lemon.svg";
import { columns } from "./config";
import { tableData, treeData2, chartData2, cardsData } from "./mockData";
import "./style.css";
import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
const { Search } = Input;



const Page = () => {
  const scatterPlotRef = useRef(null);
  const fillLayerRef = useRef(null);
  const [dataSource, setDataSource] = useState(tableData);
  const [treeData, setTreeData] = useState(treeData2);
  const [chartData, setChartData] = useState(chartData2);
  const [isDrawerOpens, setIsDrawerOpens] = useState([true, true]);
  const [cardData, setCardData] = useState(cardsData);
  const [selectedProjTags, setSelectedProjTags] = useState([]);
  const [selectedCustTags, setSelectedCustTags] = useState([]);
  const [selectedRangeTags, setSelectedRangeTags] = useState([]);
  const [mousemSelectedData, setMousemSelectedData] = useState('');
  const [markedArea, setMarkedArea] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [customnersData, setCustomnersData] = useState([]);
  const [publishData, setPublishData] = useState([]);

  const [feishuData, setFeishuData] = useState([]);
  const [currentFeishuData, setCurrentFeishuData] = useState([]);


  useEffect(() => {
    console.log('init......')
    init();
  }, []);

  // icon: <FileOutlined />,
  // icon: <FolderOpenTwoTone />,

  const init = async () => {
    renderChart();
    renderMap();
    fetchFeishuAppData();
  };

  const fetchFeishuAppData = async () => {

    const responseAccessToken = await fetch("/open-apis/auth/v3/app_access_token/internal",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_secret: 'D8ghPMwm5gnsxJVVqXo6hgEdpXIEcpls',
            app_id: 'cli_a6258e69ff70900c',
          }),

        });
    if (!responseAccessToken.ok) {
      throw new Error(`HTTP error! status: ${responseAccessToken.status}`);
    }

    // 将响应体解析为 JSON
    const accessToken = await responseAccessToken.json();
    console.log(accessToken)

    const appId = 'SRNFbD1xSasuOEsxeJFcR0dWn1d';
    const responseTable = await fetch(`/open-apis/bitable/v1/apps/${appId}/tables`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken.app_access_token,
          },

        });

    // 将响应体解析为 JSON
    const tablesFeishu = await responseTable.json();
    console.log(tablesFeishu)
    const tableInfo = tablesFeishu.data.items.find((table) => table.name === "合同信息");
    const tableId = tableInfo.table_id;

    const recordsUrl = `/open-apis/bitable/v1/apps/${appId}/tables/${tableId}/records`;
    const responseRecords = await fetch(recordsUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken.app_access_token,
          },

        });

    // 将响应体解析为 JSON
    const recordsFeishu = await responseRecords.json();
    console.log(recordsFeishu)
    setFeishuData(recordsFeishu.data.items)

    const authorityAreasSet = new Set();
    const projectsSet = new Set();
    const customersSet = new Set();
    const publishSet = new Set();
    recordsFeishu.data.items.forEach((record) => {
      const authorityArea = record.fields["授权区域"];
      if(authorityArea){
        authorityArea.forEach((area) => {
          authorityAreasSet.add(area);
        });
      }

      const projects = record.fields["签约项目"];
      if(projects){
        projectsSet.add(projects);
        // projects.forEach((item) => {
        //   projectsSet.add(item);
        // });
      }

      const customers = record.fields["对方签约公司"];
      if(customers){
        customers.forEach((item) => {
          customersSet.add(item);
        });
      }

      const publish = record.fields["发行范围"];
      if(publish){
        publish.forEach((item) => {
          publishSet.add(item);
        });
      }

    });
    console.log('authorityAreasSet-----',authorityAreasSet)

    setMarkedArea([...authorityAreasSet])
    setProjectsData([...projectsSet])
    setCustomnersData([...customersSet])
    setPublishData([...publishSet])


    return [authorityAreasSet, projectsSet,customersSet];
  };

  // let markedArea = ["泰国", "菲律宾", "老挝", "缅甸", "柬埔寨"];
  // let markedAreaFunction = React.useMemo(() => fetchFeishuAppAccessToken(), []);
  // const markedArea = await markedAreaFunction;
  const renderMap = async () => {
    // let markedArea = ["泰国", "菲律宾", "老挝", "缅甸", "柬埔寨"];

    featureData.features = featureData.features.filter((feature) =>
      markedArea.includes(feature.properties.name)
    );
    const map = new window.BMapGL.Map("allmap");
    let point = new window.BMapGL.Point(116.414, 39.915);
    map.centerAndZoom(point, 1);
    map.enableScrollWheelZoom(true);
    map.setMapStyleV2({ styleJson: window.whiteStyle });

  };



  const renderChart = () => {
    if (!scatterPlotRef.current) {
      scatterPlotRef.current = new Scatter("chartContainer", {
        // padding: 40,
        data: chartData,
        xField: "year",
        yField: "month",
        size: 8,
        shape: "circle",
        pointStyle: {
          fill: "orange",
        },
        tooltip: false,
        // tooltip: {
        //   customContent: (title, data) => {
        //     return data?.[0]?.data?.name;
        //   },
        // },
        yAxis: {
          max: 13,
          label: false,
        },
        xAxis: {
          min: 2019,
          max: 2025,
          grid: {
            line: {
              style: {
                stroke: "#eee",
              },
            },
          },
          line: {
            style: {
              stroke: "#aaa",
            },
          },
        },
        label: {
          formatter: (data) => {
            return data?.name;
          },
          //    style: {
          //   fill: 'red',
          //   opacity: 0.6,
          //   fontSize: 24
          // }
        },
      });
      scatterPlotRef.current.render();
    }
  };
  const handleChange = (tag, checked, type) => {
    if (type === "proj") {
      const nextSelectedTags = checked
        ? [...selectedProjTags, tag]
        : selectedProjTags.filter((t) => t !== tag);
      setSelectedProjTags(nextSelectedTags);
    }
    if (type === "cust") {
      const nextSelectedTags = checked
        ? [...selectedCustTags, tag]
        : selectedCustTags.filter((t) => t !== tag);
      setSelectedCustTags(nextSelectedTags);
    }

    if (type === "range") {
      const nextSelectedTags = checked
        ? [...selectedRangeTags, tag]
        : selectedRangeTags.filter((t) => t !== tag);
      setSelectedRangeTags(nextSelectedTags);
    }
  };
  const onClickonDrawerOpen = (index) => {
    const _isDrawerOpens = [...isDrawerOpens];
    _isDrawerOpens[index] = !_isDrawerOpens[index];
    setIsDrawerOpens(_isDrawerOpens);
    console.log(isDrawerOpens);
  };

  console.log('projectsData=====',projectsData)
  return (
    <div className="page">
      <div id="message" className="message">
        <span>{mousemSelectedData}</span>
      </div>
      <div className="area title">
        <img src={lemonIcon} alt="" />
        地区数据
      </div>
      <div
        className="left"
        style={{ height: isDrawerOpens[0] ? "calc(100% - 44px)" : "16px" }}
      >
        <div className="drawer_icon" onClick={() => onClickonDrawerOpen(0)}>
          {isDrawerOpens[0] ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </div>
        <div
          className="cards"
          style={{
            display: isDrawerOpens[0] ? "block" : "none",
            width: "200px",
          }}
        >
          <Card title="项目">
            {projectsData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedProjTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "proj")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="客户" style={{ margin: "12px 0" }}>
            {customnersData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedCustTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "cust")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="发行范围">
            {publishData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedRangeTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "range")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
        </div>
      </div>
      <div id="allmap" className="map"></div>
      <div className="right">
        <div className="top">
          <p className="title">
            <span
              style={{ display: isDrawerOpens[1] ? "inline-block" : "none" }}
            >
              <img src={lemonIcon} alt="" />
              公司合作情况
            </span>

            <span
              className="drawer_icon"
              onClick={() => onClickonDrawerOpen(1)}
              style={{ float: "right" }}
            >
              {isDrawerOpens[1] ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
          </p>
          <div
            id="chartContainer"
            style={{
              width: "410px",
              height: "320px",
              display: isDrawerOpens[1] ? "block" : "none",
            }}
          />
        </div>
        <div
          className="bottom"
          style={{
            display: isDrawerOpens[1] ? "block" : "none",
          }}
        >
          <p className="title">
            <img src={lemonIcon} alt="" />
            列表数据
          </p>
          <Table
            columns={columns}
            dataSource={dataSource}
            size="small"
            rowKey={"name"}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
};

// const MemoPage = React.memo(Page);

export default Page;
