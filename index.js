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
  "wd-view-default":
    "direct:git@github.com:lijieniu/wdview-template.git#wdview-template-default",
  "wd-view-laravel":
    "direct:git@github.com:lijieniu/wdview-template.git#wdview-template-laravel",
  "vue2 typescript vue-router": "",
  "vue3 vite typescript vue-router": "",
};
program.version("v0.0.3");
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
            choices: ["wd-view-default", "wd-view-laravel"],
            default: "wd-view-default",
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
                if (res.project_name === "wd-view-laravel") {
                  installLaravel(name);
                } else if (res.project_name === "wd-view-default") {
                  const packagePath = path.join(downloadPath, "package.json");
                  if (fs.existsSync(packagePath)) {
                    // 直接读取string
                    const content = fs.readFileSync(packagePath).toString();
                    const template = handlebars.compile(content);
                    const result = template({
                      project_name: name,
                    });
                    fs.writeFileSync(packagePath, result);
                    install(name);
                  } else {
                    console.error("failed! no files");
                  }
                }
              } else {
                spinner.fail("下载失败！");
              }
            }
          );
        });
    }
  });
const install = (name) => {
  inquirer
    .prompt({
      name: "npm_install",
      type: "confirm",
      message: "是否立即安装依赖？",
    })
    .then((res) => {
      if (res.npm_install) {
        const spinner = ora("正在安装依赖...").start();
        const cmd = "cd " + process.cwd() + "/" + name + " && npm install";
        // 加上loading状态
        // 检测退出状态
        childProcess.exec(cmd, (error, stdout, stderr) => {
          spinner.succeed("安装完成");
          console.log("现在可以运行以下命令：");
          console.log("\t cd " + name);
          console.log("\t npm run dev");
        });
      } else {
        console.log("现在可以运行以下命令：");
        console.log("\t cd " + name);
        console.log("\t npm install");
        console.log("\t npm run dev");
      }
    });
};
const installLaravel = (name) => {
  const phpCmd =
    "cd " + process.cwd() + "/" + name + " && mv .env.example .env";
  const initSpinner = ora("正在初始化项目...").start();
  childProcess.exec(phpCmd, (error, stdout, stderr) => {
    initSpinner.succeed("初始化完成！");
    inquirer
      .prompt({
        name: "npm_install",
        type: "confirm",
        message: "是否立即安装依赖？",
      })
      .then((res) => {
        if (res.npm_install) {
          const spinner = ora("正在安装依赖...").start();
          const cmd = "cd " + process.cwd() + "/" + name + " && npm install";
          // 加上loading状态
          // 检测退出状态
          childProcess.exec(cmd, (error, stdout, stderr) => {
            spinner.succeed("安装完成");
            console.log("现在可以运行以下命令：");
            console.log("\t cd " + name);
            console.log("\t composer install");
            console.log("\t php artisan key:generate");
            console.log("\t php artisan serve");
          });
        } else {
          console.log("现在可以运行以下命令：");
          console.log("\t cd " + name);
          console.log("\t npm install");
          console.log("\t composer install");
          console.log("\t php artisan key:generate");
          console.log("\t php artisan serve");
        }
      });
  });
};
program.parse(process.argv);
