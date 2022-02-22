#!/usr/bin/env node
console.log("wdview-cli");

import { program } from "commander";
import inquirer from "inquirer";
import download from "download-git-repo";
import handlebars from "handlebars";
import path from "path";
import fs from "fs";
import ora from "ora";
import childProcess from "child_process";

// 模板对应git地址
const templateMap = {
  "wd-view":
    "direct:git@github.com:lijieniu/wdview-template.git#wdview-template-default",
  "wd-view-laravel": "",
};
program.version("v0.0.1");
program
  .command("create <name>")
  .description("create a new project")
  .option("-t, --type <type>", "type of the project to create")
  .action((name, opts) => {
    console.log(name, opts.type);
    if (!opts.type) {
      // 如果创建时没有选择模板类型，需要在这里选择
      inquirer
        .prompt([
          {
            name: "project_name",
            type: "list",
            message: "choose a type of project to init",
            choices: ["wd-view", "wd-view-laravel"],
            default: "wd-view",
          },
        ])
        .then((res) => {
          const spinner = ora("正在执行git clone...").start();
          const downloadPath = process.cwd() + "/" + name;
          download(
            templateMap[res.project_name],
            downloadPath,
            { clone: true },
            (error) => {
              if (!error) {
                spinner.succeed("成功执行git clone...");
                const packagePath = path.join(downloadPath, "package.json");
                if (fs.existsSync(packagePath)) {
                  const content = fs.readFileSync(packagePath).toString();
                  const template = handlebars.compile(content);
                  const result = template({
                    project_name: name,
                  });
                  fs.writeFileSync(packagePath, result);
                  install(downloadPath);
                } else {
                  console.error("failed! no files");
                }
              } else {
                spinner.fail("下载失败！");
              }
            }
          );
        });
    }
  });
const install = (path) => {
  inquirer
    .prompt({
      name: "npm_install",
      type: "confirm",
      message: "是否立即安装依赖？",
    })
    .then((res) => {
      if (res.npm_install) {
        const spinner = ora("正在安装依赖...").start();
        const cmd = "cd " + path + " && npm install wd-view";
        childProcess.exec(cmd, (error, stdout, stderr) => {
          spinner.succeed("安装完成");
        });
      }
    });
};
program.parse(process.argv);
