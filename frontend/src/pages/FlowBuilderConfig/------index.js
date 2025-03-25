import React, { useState, useEffect, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory, useParams } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { Paper, Button, CircularProgress, Box } from "@material-ui/core";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Typography,
} from "@mui/material";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "react-flow-renderer";

import api from "../../services/api";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useNodeStorage } from "../../stores/useNodeStorage";
import { colorPrimary } from "../../styles/styles";

// Importações dos componentes de modal
import FlowBuilderAddTextModal from "../../components/FlowBuilderAddTextModal";
import FlowBuilderIntervalModal from "../../components/FlowBuilderIntervalModal";
import FlowBuilderMenuModal from "../../components/FlowBuilderMenuModal";
import FlowBuilderAddImgModal from "../../components/FlowBuilderAddImgModal";
import FlowBuilderAddAudioModal from "../../components/FlowBuilderAddAudioModal";
import FlowBuilderRandomizerModal from "../../components/FlowBuilderRandomizerModal";
import FlowBuilderAddVideoModal from "../../components/FlowBuilderAddVideoModal";
import FlowBuilderSingleBlockModal from "../../components/FlowBuilderSingleBlockModal";
import FlowBuilderTicketModal from "../../components/FlowBuilderAddTicketModal";
import FlowBuilderTypebotModal from "../../components/FlowBuilderAddTypebotModal";
import FlowBuilderOpenAIModal from "../../components/FlowBuilderAddOpenAIModal";
import FlowBuilderAddQuestionModal from "../../components/FlowBuilderAddQuestionModal";

// Importações dos tipos de nós
import {
  messageNode,
  startNode,
  menuNode,
  intervalNode,
  imgNode,
  audioNode,
  randomizerNode,
  videoNode,
  singleBlockNode,
  ticketNode,
  typebotNode,
  openaiNode,
  questionNode,
} from "./nodes";

// Importações dos ícones
import {
  RocketLaunch,
  LibraryBooks,
  DynamicFeed,
  CallSplit,
  AccessTime,
  ConfirmationNumber,
  Message,
  Image,
  MicNone,
  Videocam,
} from "@mui/icons-material";
import { SiOpenai } from "react-icons/si";
import BallotIcon from "@mui/icons-material/Ballot";
import typebotIcon from "../../assets/typebot-ico.png";

import "reactflow/dist/style.css";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    backgroundColor: "#F8F9FA",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const nodeTypes = {
  message: messageNode,
  start: startNode,
  menu: menuNode,
  interval: intervalNode,
  img: imgNode,
  audio: audioNode,
  randomizer: randomizerNode,
  video: videoNode,
  singleBlock: singleBlockNode,
  ticket: ticketNode,
  typebot: typebotNode,
  openai: openaiNode,
  question: questionNode,
};

const geraStringAleatoria = (tamanho) => {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array(tamanho)
    .fill()
    .map(() => caracteres.charAt(Math.floor(Math.random() * caracteres.length)))
    .join("");
};

const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 100 },
    data: { label: "Inicio do fluxo" },
    type: "start",
  },
];

// Reorganização das ações do menu
const actions = [
  {
    icon: <RocketLaunch sx={{ color: "#3ABA38" }} />,
    name: "Inicio",
    type: "start",
  },
  {
    icon: <LibraryBooks sx={{ color: "#EC5858" }} />,
    name: "Conteúdo",
    type: "content",
  },
  {
    icon: <DynamicFeed sx={{ color: "#683AC8" }} />,
    name: "Menu",
    type: "menu",
  },
  {
    icon: <AccessTime sx={{ color: "#F7953B" }} />,
    name: "Intervalo",
    type: "interval",
  },
  {
    icon: <ConfirmationNumber sx={{ color: "#F7953B" }} />,
    name: "Filas",
    type: "ticket",
  },
  {
    icon: (
      <Box
        component="img"
        src={typebotIcon}
        alt="TypeBot"
        sx={{ width: 24, height: 24 }}
      />
    ),
    name: "TypeBot",
    type: "typebot",
  },
  {
    icon: <SiOpenai style={{ color: "#F7953B", width: 24, height: 24 }} />,
    name: "OpenAI",
    type: "openai",
  },
  {
    icon: <BallotIcon sx={{ color: "#F7953B" }} />,
    name: "Variável",
    type: "question",
  },
  {
    icon: <CallSplit sx={{ color: "#1FBADC" }} />,
    name: "Randomizador",
    type: "random",
  },
  { icon: <Message sx={{ color: "#6865A5" }} />, name: "Texto", type: "text" },
  { icon: <Image sx={{ color: "#6865A5" }} />, name: "Imagem", type: "img" },
  { icon: <MicNone sx={{ color: "#6865A5" }} />, name: "Áudio", type: "audio" },
  {
    icon: <Videocam sx={{ color: "#6865A5" }} />,
    name: "Vídeo",
    type: "video",
  },
];

export const FlowBuilderConfig = () => {
  const classes = useStyles();
  const history = useHistory();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const storageItems = useNodeStorage();

  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dataNode, setDataNode] = useState(null);

  // Estados para controlar os modais
  const [modalAddText, setModalAddText] = useState(null);
  const [modalAddInterval, setModalAddInterval] = useState(false);
  const [modalAddMenu, setModalAddMenu] = useState(null);
  const [modalAddImg, setModalAddImg] = useState(null);
  const [modalAddAudio, setModalAddAudio] = useState(null);
  const [modalAddRandomizer, setModalAddRandomizer] = useState(null);
  const [modalAddVideo, setModalAddVideo] = useState(null);
  const [modalAddSingleBlock, setModalAddSingleBlock] = useState(null);
  const [modalAddTicket, setModalAddTicket] = useState(null);
  const [modalAddTypebot, setModalAddTypebot] = useState(null);
  const [modalAddOpenAI, setModalAddOpenAI] = useState(null);
  const [modalAddQuestion, setModalAddQuestion] = useState(null);

  useEffect(() => {
    const fetchFlow = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/flowbuilder/flow/${id}`);
        if (data.flow.flow !== null) {
          setNodes(data.flow.flow.nodes);
          setEdges(data.flow.flow.connections);
          const variables = data.flow.flow.nodes
            .filter((nd) => nd.type === "question")
            .map((variable) => variable.data.typebotIntegration.answerKey);
          localStorage.setItem("variables", JSON.stringify(variables));
        }
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlow();
  }, [id]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const saveFlow = async () => {
    try {
      await api.post("/flowbuilder/flow", {
        idFlow: id,
        nodes: nodes,
        connections: edges,
      });
      toast.success("Fluxo salvo com sucesso");
    } catch (error) {
      toastError(error);
    }
  };

  const addNode = (type, data = {}) => {
    const newNode = {
      id: geraStringAleatoria(30),
      position: {
        x: nodes[nodes.length - 1].position.x + 250,
        y: nodes[nodes.length - 1].position.y,
      },
      data: { ...data },
      type: type,
    };
    setNodes((old) => [...old, newNode]);
  };

  const handleActionClick = (type) => {
    switch (type) {
      case "start":
        addNode("start", { label: "Inicio do fluxo" });
        break;
      case "content":
        setModalAddSingleBlock("create");
        break;
      case "menu":
        setModalAddMenu("create");
        break;
      case "interval":
        setModalAddInterval("create");
        break;
      case "ticket":
        setModalAddTicket("create");
        break;
      case "typebot":
        setModalAddTypebot("create");
        break;
      case "openai":
        setModalAddOpenAI("create");
        break;
      case "question":
        setModalAddQuestion("create");
        break;
      case "random":
        setModalAddRandomizer("create");
        break;
      case "text":
        setModalAddText("create");
        break;
      case "img":
        setModalAddImg("create");
        break;
      case "audio":
        setModalAddAudio("create");
        break;
      case "video":
        setModalAddVideo("create");
        break;
      default:
        console.log(`Ação ${type} não implementada`);
    }
  };

  const updateNode = (dataAlter) => {
    setNodes((old) =>
      old.map((itemNode) => {
        if (itemNode.id === dataAlter.id) {
          return dataAlter;
        }
        return itemNode;
      })
    );
    setModalAddText(null);
    setModalAddInterval(null);
    setModalAddMenu(null);
    setModalAddOpenAI(null);
    setModalAddTypebot(null);
    setModalAddImg(null);
    setModalAddAudio(null);
    setModalAddRandomizer(null);
    setModalAddVideo(null);
    setModalAddSingleBlock(null);
    setModalAddTicket(null);
    setModalAddQuestion(null);
  };

  const doubleClickNode = (event, node) => {
    setDataNode(node);
    switch (node.type) {
      case "message":
        setModalAddText("edit");
        break;
      case "interval":
        setModalAddInterval("edit");
        break;
      case "menu":
        setModalAddMenu("edit");
        break;
      case "img":
        setModalAddImg("edit");
        break;
      case "audio":
        setModalAddAudio("edit");
        break;
      case "randomizer":
        setModalAddRandomizer("edit");
        break;
      case "video":
        setModalAddVideo("edit");
        break;
      case "singleBlock":
        setModalAddSingleBlock("edit");
        break;
      case "ticket":
        setModalAddTicket("edit");
        break;
      case "typebot":
        setModalAddTypebot("edit");
        break;
      case "openai":
        setModalAddOpenAI("edit");
        break;
      case "question":
        setModalAddQuestion("edit");
        break;
      default:
        console.log(`Edição para o tipo ${node.type} não implementada`);
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Desenhe seu fluxo</Title>
      </MainHeader>
      {!loading ? (
        <Paper className={classes.mainPaper} variant="outlined">
          <FlowBuilderAddTextModal
            open={modalAddText}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddText(null)}
          />
          <FlowBuilderIntervalModal
            open={modalAddInterval}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddInterval(null)}
          />
          <FlowBuilderMenuModal
            open={modalAddMenu}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddMenu(null)}
          />
          <FlowBuilderAddImgModal
            open={modalAddImg}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddImg(null)}
          />
          <FlowBuilderAddAudioModal
            open={modalAddAudio}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddAudio(null)}
          />
          <FlowBuilderRandomizerModal
            open={modalAddRandomizer}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddRandomizer(null)}
          />
          <FlowBuilderAddVideoModal
            open={modalAddVideo}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddVideo(null)}
          />
          <FlowBuilderSingleBlockModal
            open={modalAddSingleBlock}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddSingleBlock(null)}
          />
          <FlowBuilderTicketModal
            open={modalAddTicket}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddTicket(null)}
          />
          <FlowBuilderTypebotModal
            open={modalAddTypebot}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddTypebot(null)}
          />
          <FlowBuilderOpenAIModal
            open={modalAddOpenAI}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddOpenAI(null)}
          />
          <FlowBuilderAddQuestionModal
            open={modalAddQuestion}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddQuestion(null)}
          />
          <FlowBuilderAddQuestionModal
            open={modalAddQuestion}
            onSave={addNode}
            data={dataNode}
            onUpdate={updateNode}
            close={() => setModalAddQuestion(null)}
          />

          <Stack>
            <SpeedDial
              ariaLabel="SpeedDial de ações"
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                ".MuiSpeedDial-fab": {
                  backgroundColor: colorPrimary(),
                  "&:hover": {
                    backgroundColor: colorPrimary(),
                  },
                },
              }}
              icon={<SpeedDialIcon />}
              direction={"down"}
            >
              {actions.map((action) => (
                <SpeedDialAction
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  tooltipOpen
                  tooltipPlacement={"right"}
                  onClick={() => handleActionClick(action.type)}
                />
              ))}
            </SpeedDial>
          </Stack>
          <Stack
            sx={{
              position: "absolute",
              justifyContent: "center",
              flexDirection: "row",
              width: "100%",
            }}
          >
            <Typography
              style={{ color: "#010101", textShadow: "#010101 1px 0 10px" }}
            >
              Não se esqueça de salvar seu fluxo!
            </Typography>
          </Stack>
          <Stack direction={"row"} justifyContent={"end"}>
            <Button
              sx={{ textTransform: "none" }}
              variant="contained"
              color="primary"
              onClick={saveFlow}
            >
              Salvar
            </Button>
          </Stack>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={doubleClickNode}
            nodeTypes={nodeTypes}
            fitView
            style={{ backgroundColor: "#F8F9FA" }}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={-1} />
          </ReactFlow>
        </Paper>
      ) : (
        <Stack justifyContent={"center"} alignItems={"center"} height={"70vh"}>
          <CircularProgress />
        </Stack>
      )}
    </MainContainer>
  );
};
