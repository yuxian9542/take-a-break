<template>
  <div class="operator-panel tl">
    <el-form
      :model="panelParams"
      ref="ruleForm"
      label-width="200px"
      class="operator-panel__ruleForm"
    >
      <!-- APIKEY field hidden - loaded from .env -->
      <el-form-item style="display: none;">
        <template #label>
          <div class="flex flex-x-start flex-y-center">
            <h4>APIKEY</h4>
            <el-tooltip
              effect="light"
              :visible-arrow="false"
              popper-class="popper-class-text-tip"
              placement="right"
            >
              <!-- 使用具名插槽传递内容 -->
              <template #content>
                APIKEY for calling the model, please visit
                <a
                  href="https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys"
                  target="_blank"
                  >Open Platform</a
                >
                to apply
              </template>
              <i class="iconfont icon-info1 pointer"></i>
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="apiKey" placeholder="APIKEY loaded from .env" :disabled="true" />
      </el-form-item>
      <el-form-item label="Model" prop="media_type">
        <el-select v-model="modelId" placeholder="Please select" :disabled="isConnected">
          <el-option
            v-for="item in modelList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <!-- System prompt is hidden but set to fixed value -->
      <el-form-item prop="instructions" style="display: none;">
        <SystemPrompt
          :instructions="panelParams.instructions"
          :disabled="true"
          @onUpdateInstructions="updateInstructions"
        />
      </el-form-item>
      <!-- Voice selection (output format is always audio) -->
      <el-form-item prop="voice">
        <template #label>
          <div class="flex flex-x-start flex-y-center">
            <h4>Voice</h4>
            <el-tooltip
              effect="light"
              :visible-arrow="false"
              popper-class="popper-class-text-tip"
              placement="right"
            >
              <!-- 使用具名插槽传递内容 -->
              <template #content>
                Select the voice for audio output
              </template>
              <i class="iconfont icon-info1 pointer"></i>
            </el-tooltip>
          </div>
        </template>
        <el-select
          v-model="panelParams.voice"
          size="small"
          placeholder="Please select"
          :disabled="isConnected"
        >
          <el-option
            v-for="item in voiceTypeArr"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <!-- Model tools - always enabled, hidden UI -->
      <el-form-item label="Model Tools" prop="tools" style="display: none;">
        <ModelTools
          :showTools="showTools"
          :defaultOpenedTools="['web_search']"
          :disableOperate="true"
          @onChooseTool="onChooseTool"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import SystemPrompt from "@/components/SystemPrompt.vue";
import ModelTools from "@/components/ModelParams/ModelTools.vue";
import { TOOLS_TYPE } from "@/constants/modules/audioVideoCall";
import { RESPONSE_TYPE, MODEL_TIMBRE } from "@/constants/modules/audioVideoCall";

export default {
  name: "OperatorPanel",
  inheritAttrs: false,
  props: {
    // 右侧面板参数集合对象
    panelParams: {
      type: Object,
      default: () => {},
    },
    // 是否已连接
    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    SystemPrompt,
    ModelTools,
  },
  watch: {
    // 服务响应返回输出方式 - always audio
    responseType: {
      handler(val) {
        this.$emit("onResponseTypeChange", RESPONSE_TYPE.AUDIO);
      },
      immediate: true,
    },
    apiKey: {
      handler(val) {
        this.$emit("onApiKeyChange", val);
      },
      immediate: true,
    },
    modelId: {
      handler(val) {
        this.panelParams.model = val;
      },
      immediate: true,
    },
  },
  data() {
    return {
      apiKey: import.meta.env.VITE_GLM_API_KEY || "775872a1c07943668b903fc2200e453e.bMzlOM0MjHFcGut0", // api key from .env or hardcoded
      RESPONSE_TYPE, // 响应类型
      TOOLS_TYPE, // 工具类型 - make available in template
      showTools: [TOOLS_TYPE.WEB_SEARCH],
      voiceTypeArr: [
        // 返回音频的音色
        { label: "Male Voice", value: MODEL_TIMBRE.XIAOCHEN },
        { label: "Female Voice", value: MODEL_TIMBRE.TONGTONG },
        { label: "Sweet Female", value: MODEL_TIMBRE.TIANMEINVXING },
        { label: "Young Male", value: MODEL_TIMBRE.QINGNIANDAXUESHENG },
        { label: "Elite Youth", value: MODEL_TIMBRE.JINGYIGNQINGNIAN },
        { label: "Cute Girl", value: MODEL_TIMBRE.MENGMENGNVTONG },
        { label: "Young Girl", value: MODEL_TIMBRE.SHAONV },
      ],
      modelId: "glm-realtime", // 模型
      modelList: [
        // 模型列表
        {
          label: "GLM-Realtime-Flash",
          value: "glm-realtime",
        },
        {
          label: "GLM-Realtime-Air",
          value: "glm-4-realtime",
        },
      ],
      responseType: RESPONSE_TYPE.AUDIO, // Always audio
    };
  },
  methods: {
    // 更新系统提示
    updateInstructions(val) {
      this.panelParams.instructions = val;
    },
    // 更新模型工具 - always enable web search
    onChooseTool(val) {
      this.panelParams.tools = [];
      this.panelParams.beta_fields.auto_search = true; // Always enabled
      console.log("--ModelTrialCenter--currentTool--", val);
    },
  },
};
</script>

<style scoped lang="less">
.operator-panel {
  width: 362px;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid rgba(224, 224, 224, 0.6);
  padding: 24px;
  box-sizing: border-box;
  :deep(h4),
  :deep(.el-form-item__label) {
    color: #131212;
    font-size: 14px;
    font-weight: 600;
    height: 24px;
    line-height: 24px;
  }
  :deep(.el-form-item__label) {
    margin-bottom: 10px;
    i {
      font-weight: 400;
    }
  }
  &__ruleForm {
    .el-form-item {
      display: grid;
      margin-bottom: 24px;
      .icon-info1 {
        display: block;
        width: 20px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        border-radius: 4px;
        color: #757575;
        font-size: 16px;
        margin-left: 6px;
        &:hover {
          background-color: rgba(19, 18, 18, 0.05);
        }
      }
      :deep(.el-form-item__label) {
        display: flex;
        justify-content: start;
      }
      :deep(.el-form-item__content) {
        margin-left: 0 !important;
        line-height: 22px;
      }
      .el-select {
        width: 100%;
        line-height: 32px;
        display: block;
      }
      .params-option {
        margin-top: 12px;
        margin-bottom: 24px;
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
